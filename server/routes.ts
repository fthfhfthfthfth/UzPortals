import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGiftSchema, insertRentalSchema, insertPurchaseSchema, insertGiftRequestSchema } from "@shared/schema";
import { verifyTelegramWebAppData } from "./auth";
import { sendGiftRequestNotification } from "./bot";
import { z } from "zod";
import crypto from "crypto";

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || "0");

export async function registerRoutes(app: Express): Promise<Server> {

  // Middleware to check maintenance mode (only for non-admin users)
  async function checkMaintenanceMode(req: any, res: any, next: any) {
    const isUserAdmin = req.session.telegramId === ADMIN_TELEGRAM_ID;
    
    if (isUserAdmin) {
      return next();
    }

    const maintenanceEnabled = await storage.getMaintenanceMode();
    if (maintenanceEnabled) {
      return res.status(503).json({ 
        message: "Tizim texnik xizmat ko'rsatish rejimida. Iltimos, keyinroq qayta urinib ko'ring.",
        maintenance: true 
      });
    }
    next();
  }

  // Middleware to check if user is authenticated
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session.telegramId) {
      return res.status(401).json({ message: "Tizimga kirish talab qilinadi" });
    }
    next();
  }

  // Middleware to verify CSRF token
  function requireCsrf(req: any, res: any, next: any) {
    const token = req.headers["x-csrf-token"];
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ message: "CSRF token noto'g'ri" });
    }
    next();
  }

  // Middleware to check admin
  function isAdmin(req: any, res: any, next: any) {
    if (!req.session.telegramId || !req.session.isAdmin) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }
    next();
  }

  // ============ USER ROUTES ============

  // Authenticate with Telegram WebApp
  app.post("/api/users/auth", async (req, res) => {
    try {
      const { telegramId, username, firstName, lastName } = req.body;

      if (!telegramId) {
        return res.status(401).json({ message: "Telegram autentifikatsiya xatosi" });
      }

      let user = await storage.getUser(telegramId);

      if (!user) {
        user = await storage.createUser({
          telegramId,
          username: username || `user${telegramId}`,
          firstName: firstName || '',
          lastName: lastName || '',
        });
      } else {
        // Update user info if changed
        if (firstName || lastName) {
          user.firstName = firstName || user.firstName;
          user.lastName = lastName || user.lastName;
          await user.save();
        }
      }

      // Generate CSRF token
      const csrfToken = crypto.randomBytes(32).toString("hex");

      // Set session
      req.session.telegramId = telegramId;
      req.session.username = user.username;
      req.session.isAdmin = telegramId === ADMIN_TELEGRAM_ID;
      req.session.csrfToken = csrfToken;

      // Migrate old balance format to new format
      if (typeof user.balance === 'object' && user.balance !== null) {
        const oldBalance = user.balance as any;
        const newBalance = oldBalance.ton || 0;
        user.balance = newBalance;
        await user.save();
      }

      res.json({
        _id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        walletAddress: user.walletAddress,
        csrfToken
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user profile
  app.get("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);

      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      // Migrate old balance format to new format if necessary
      if (typeof user.balance === 'object' && user.balance !== null) {
        const oldBalance = user.balance as any;
        const newBalance = oldBalance.ton || 0;
        user.balance = newBalance;
        await user.save();
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Connect wallet
  app.post("/api/users/wallet", requireAuth, requireCsrf, async (req, res) => {
    try {
      const { walletAddress } = req.body;

      const user = await storage.connectWallet(req.session.telegramId!, walletAddress);

      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Process deposit
  app.post("/api/users/deposit", requireAuth, requireCsrf, async (req, res) => {
    try {
      const { amount, transactionBoc, network } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Noto'g'ri summa" });
      }

      if (!transactionBoc) {
        return res.status(400).json({ message: "Tranzaksiya ma'lumotlari topilmadi" });
      }

      // Validate network - only accept mainnet (-239)
      if (network !== "-239") {
        return res.status(400).json({
          message: "Faqat mainnet tranzaksiyalari qabul qilinadi. Testnet ishlatmang!"
        });
      }

      const user = await storage.processDeposit(
        req.session.telegramId!,
        parseFloat(amount),
        transactionBoc
      );

      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      res.json({
        balance: user.balance,
        message: "Deposit muvaffaqiyatli qabul qilindi"
      });
    } catch (error: any) {
      console.error("Deposit processing error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============ GIFT ROUTES ============

  // Get all gifts (with optional filter)
  app.get("/api/gifts", async (req, res) => {
    try {
      const filter = req.query.filter as "all" | "available" | "sold" | undefined;
      const gifts = await storage.getGifts(filter);
      res.json(gifts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single gift
  app.get("/api/gifts/:id", async (req, res) => {
    try {
      const gift = await storage.getGift(req.params.id);

      if (!gift) {
        return res.status(404).json({ message: "Gift topilmadi" });
      }

      res.json(gift);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create gift (admin only)
  app.post("/api/gifts", isAdmin, requireCsrf, async (req, res) => {
    try {
      const validated = insertGiftSchema.parse(req.body);
      const gift = await storage.createGift(validated);
      res.json(gift);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update gift (admin only)
  app.put("/api/gifts/:id", isAdmin, requireCsrf, async (req, res) => {
    try {
      const validated = insertGiftSchema.partial().parse(req.body);
      const gift = await storage.updateGift(req.params.id, validated);

      if (!gift) {
        return res.status(404).json({ message: "Gift topilmadi" });
      }

      res.json(gift);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Delete gift (admin only)
  app.delete("/api/gifts/:id", isAdmin, requireCsrf, async (req, res) => {
    try {
      const success = await storage.deleteGift(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Gift topilmadi" });
      }

      res.json({ message: "Gift o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ PURCHASE ROUTES ============

  // Create purchase (buy gift)
  app.post("/api/purchases", requireAuth, requireCsrf, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      const { giftId, transactionHash } = req.body;
      if (!giftId) {
        return res.status(400).json({ message: "Gift ID talab qilinadi" });
      }

      const gift = await storage.getGift(giftId);
      if (!gift) {
        return res.status(404).json({ message: "Gift topilmadi" });
      }

      const purchase = await storage.createPurchase({
        userId: (user._id as any).toString(),
        giftId: giftId,
        price: gift.price,
        transactionHash,
      });

      res.json(purchase);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get current user purchases
  app.get("/api/purchases/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      const purchases = await storage.getUserPurchasesWithGifts((user._id as any).toString());
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all purchases (admin only)
  app.get("/api/purchases", isAdmin, async (req, res) => {
    try {
      const purchases = await storage.getAllPurchases();
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ GIFT REQUEST ROUTES ============

  // Create gift request (user)
  app.post("/api/gift-requests", requireAuth, requireCsrf, checkMaintenanceMode, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      const validated = insertGiftRequestSchema.parse(req.body);
      const giftRequest = await storage.createGiftRequest({
        userId: (user._id as any).toString(),
        giftName: validated.giftName,
        giftDescription: validated.giftDescription,
        telegramGiftUrl: validated.telegramGiftUrl,
      });

      res.json(giftRequest);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user gift requests
  app.get("/api/gift-requests/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      const requests = await storage.getUserGiftRequests((user._id as any).toString());
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all gift requests (admin only)
  app.get("/api/gift-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllGiftRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update gift request status (admin only)
  app.put("/api/gift-requests/:id", isAdmin, requireCsrf, async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Noto'g'ri status" });
      }

      const request = await storage.updateGiftRequestStatus(req.params.id, status, adminNote);
      
      if (!request) {
        return res.status(404).json({ message: "So'rov topilmadi" });
      }

      // Send notification to @UzPora when request is approved
      if (status === "approved") {
        const userInfo = request.userId as any;
        await sendGiftRequestNotification({
          giftName: request.giftName,
          giftDescription: request.giftDescription,
          telegramGiftUrl: request.telegramGiftUrl,
          username: userInfo?.username,
          firstName: userInfo?.firstName,
        });
      }

      res.json(request);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete gift request (admin only)
  app.delete("/api/gift-requests/:id", isAdmin, requireCsrf, async (req, res) => {
    try {
      const success = await storage.deleteGiftRequest(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "So'rov topilmadi" });
      }

      res.json({ message: "So'rov o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ RENTAL ROUTES (Keep for backward compatibility) ============

  // Create rental
  app.post("/api/rentals", requireAuth, requireCsrf, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      const validated = insertRentalSchema.parse(req.body);
      const { giftId, duration, endDate, totalCost } = validated;
      const rental = await storage.createRental({
        userId: (user._id as any).toString(),
        giftId: giftId,
        duration: duration,
        startDate: new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        totalCost: totalCost || 0,
        status: "active",
      });
      res.json(rental);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(400).json({ message: error.message });
    }
  });

  // Get current user rentals
  app.get("/api/rentals/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.telegramId!);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }

      const withDetails = req.query.withDetails === "true";
      const rentals = await storage.getUserRentalsWithGifts((user._id as any).toString(), withDetails);
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all rentals (admin only)
  app.get("/api/rentals", isAdmin, async (req, res) => {
    try {
      const rentals = await storage.getAllRentals();
      res.json(rentals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Complete rental (admin only)
  app.post("/api/rentals/:id/complete", isAdmin, requireCsrf, async (req, res) => {
    try {
      const rental = await storage.completeRental(req.params.id);

      if (!rental) {
        return res.status(404).json({ message: "Ijara topilmadi" });
      }

      res.json(rental);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ STATS ROUTE ============

  // Get stats (admin only)
  app.get("/api/stats", isAdmin, async (req, res) => {
    try {
      const gifts = await storage.getGifts();
      const purchases = await storage.getAllPurchases();
      const rentals = await storage.getAllRentals();
      const users = await storage.getAllUsers();

      const totalSales = purchases.filter(p => p.status === 'completed').length;
      const purchaseRevenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
      const rentalRevenue = rentals.reduce((sum, r) => sum + (r.totalCost || 0), 0);

      res.json({
        totalGifts: gifts.length,
        totalSales: totalSales,
        activeRentals: rentals.filter(r => r.status === 'active').length,
        totalUsers: users.length,
        revenue: purchaseRevenue + rentalRevenue,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get maintenance mode status
  app.get("/api/maintenance", async (req, res) => {
    try {
      const isEnabled = await storage.getMaintenanceMode();
      res.json({ enabled: isEnabled });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Set maintenance mode (admin only)
  app.post("/api/admin/maintenance", isAdmin, requireCsrf, async (req, res) => {
    try {
      const { enabled } = req.body;
      const result = await storage.setMaintenanceMode(enabled);
      res.json({ enabled: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Migration endpoint to fix old balance format
  app.post("/api/admin/migrate-balances", isAdmin, requireCsrf, async (req, res) => {
    try {
      const { User } = await import("@shared/schema");
      const users = await User.find({}); // Get Mongoose documents, not lean objects
      let migratedCount = 0;

      for (const user of users) {
        // Check if balance is an object and not null, indicating the old format
        if (typeof user.balance === 'object' && user.balance !== null) {
          const oldBalance = user.balance as any; // Cast to any to access properties like 'ton'
          const newBalance = oldBalance.ton || 0; // Extract 'ton' value or default to 0
          user.balance = newBalance; // Update balance to the new format (number)
          await user.save(); // Save the updated user document
          migratedCount++;
        }
      }

      res.json({
        message: `${migratedCount} foydalanuvchilarning balansi yangilandi`,
        migratedCount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ ADMIN ROUTES ============

  // Admin: Get all users
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Update user balance
  app.post("/api/admin/users/:userId/balance", isAdmin, requireCsrf, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({ message: "Noto'g'ri summa" });
      }

      const user = await storage.updateUserBalanceAdmin(userId, amount);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Cancel rental
  app.post("/api/admin/rentals/:rentalId/cancel", isAdmin, requireCsrf, async (req, res) => {
    try {
      const { rentalId } = req.params;
      const rental = await storage.cancelRental(rentalId);
      res.json(rental);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}