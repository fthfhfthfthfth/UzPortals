import {
  Gift, User, Rental, Purchase, GiftRequest, MaintenanceMode,
  type IGift, type IUser, type IRental, type IPurchase, type IGiftRequest,
  type InsertGift, type InsertUser, type InsertRental, type InsertPurchase, type InsertGiftRequest
} from "@shared/schema";
import { ObjectId } from "mongodb";

export interface IStorage {
  // User operations
  getUser(telegramId: number): Promise<IUser | null>;
  createUser(user: InsertUser): Promise<IUser>;
  updateUserBalance(telegramId: number, amount: number): Promise<IUser | null>;
  connectWallet(telegramId: number, walletAddress: string): Promise<IUser | null>;
  processDeposit(telegramId: number, amount: number, transactionBoc: string): Promise<IUser | null>;
  getUserById(userId: string): Promise<IUser | null>; // Added based on changes

  // Gift operations
  getGifts(filter?: "all" | "available" | "sold"): Promise<IGift[]>;
  getGift(id: string): Promise<IGift | null>;
  createGift(gift: InsertGift): Promise<IGift>;
  updateGift(id: string, gift: Partial<InsertGift>): Promise<IGift | null>;
  deleteGift(id: string): Promise<boolean>;

  // Purchase operations
  createPurchase(purchaseData: {
    userId: string;
    giftId: string;
    price: number;
    transactionHash?: string;
  }): Promise<IPurchase>;
  getUserPurchases(userId: string): Promise<IPurchase[]>;
  getUserPurchasesWithGifts(userId: string): Promise<any[]>;
  getAllPurchases(): Promise<IPurchase[]>;

  // Rental operations
  createRental(rentalData: {
    userId: string;
    giftId: string;
    duration: number;
    startDate: Date;
    endDate: Date;
    totalCost: number;
    status: 'active' | 'completed' | 'cancelled';
  }): Promise<IRental>; // Updated based on changes
  getUserRentals(userId: string, activeOnly?: boolean): Promise<IRental[]>;
  getUserRentalsWithGifts(userId: string, activeOnly?: boolean): Promise<any[]>; // Updated based on changes
  getAllRentals(): Promise<IRental[]>; // This method is used by both regular users and admin.
  completeRental(rentalId: string): Promise<IRental | null>; // Updated based on changes

  // Stats
  getStats(): Promise<{ // Updated based on changes
    totalGifts: number;
    activeRentals: number;
    totalUsers: number;
    revenue: number;
  }>;
  getUsersWithStats(): Promise<any[]>; // Added based on changes

  // Admin operations (newly added based on changes)
  getAllUsers(): Promise<any[]>; // Updated based on changes
  updateUserBalanceAdmin(userId: string, amount: number): Promise<IUser | null>;
  cancelRental(rentalId: string): Promise<IRental | null>;

  // Gift Request operations
  createGiftRequest(requestData: {
    userId: string;
    giftName: string;
    giftDescription?: string;
    telegramGiftUrl: string;
  }): Promise<IGiftRequest>;
  getUserGiftRequests(userId: string): Promise<IGiftRequest[]>;
  getAllGiftRequests(): Promise<IGiftRequest[]>;
  updateGiftRequestStatus(requestId: string, status: "approved" | "rejected", adminNote?: string): Promise<IGiftRequest | null>;
  deleteGiftRequest(requestId: string): Promise<boolean>;

  // Maintenance mode operations
  getMaintenanceMode(): Promise<boolean>;
  setMaintenanceMode(enabled: boolean): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  // User operations
  async getUser(telegramId: number): Promise<IUser | null> {
    return await User.findOne({ telegramId });
  }

  async createUser(userData: InsertUser): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async updateUserBalance(telegramId: number, amount: number): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { telegramId },
      { $inc: { balance: amount } },
      { new: true }
    );
  }

  async connectWallet(telegramId: number, walletAddress: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { telegramId },
      { walletAddress },
      { new: true }
    );
  }

  async processDeposit(telegramId: number, amount: number, transactionBoc: string): Promise<IUser | null> {
    console.log(`Processing deposit for user ${telegramId}: ${amount} TON`);
    console.log(`Transaction BOC: ${transactionBoc.substring(0, 50)}...`);

    return await User.findOneAndUpdate(
      { telegramId },
      { $inc: { balance: amount } },
      { new: true }
    );
  }

  // Added based on changes
  async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId).lean() as IUser | null;
  }

  // Gift operations
  async getGifts(filter?: "all" | "available" | "sold"): Promise<IGift[]> {
    if (filter === "available") {
      return await Gift.find({ status: "available" });
    } else if (filter === "sold") {
      return await Gift.find({ status: "sold" });
    }
    return await Gift.find();
  }

  async getGift(id: string): Promise<IGift | null> {
    return await Gift.findById(id);
  }

  async createGift(giftData: InsertGift): Promise<IGift> {
    const gift = new Gift(giftData);
    return await gift.save();
  }

  async updateGift(id: string, giftData: Partial<InsertGift>): Promise<IGift | null> {
    return await Gift.findByIdAndUpdate(id, giftData, { new: true });
  }

  async deleteGift(id: string): Promise<boolean> {
    const result = await Gift.findByIdAndDelete(id);
    return result !== null;
  }

  // Purchase operations
  async createPurchase(purchaseData: {
    userId: string;
    giftId: string;
    price: number;
    transactionHash?: string;
  }): Promise<IPurchase> {
    const gift = await Gift.findById(purchaseData.giftId);
    if (!gift) throw new Error("Gift topilmadi");
    if (gift.status === "sold") throw new Error("Gift allaqachon sotilgan");

    const user = await User.findById(purchaseData.userId);
    if (!user) throw new Error("Foydalanuvchi topilmadi");

    const price = gift.price;

    if (user.balance < price) {
      throw new Error(`Yetarli balans yo'q. Kerak: ${price} TON, Mavjud: ${user.balance} TON`);
    }

    const purchase = new Purchase({
      userId: purchaseData.userId,
      giftId: purchaseData.giftId,
      price: price,
      purchaseDate: new Date(),
      status: 'completed',
      transactionHash: purchaseData.transactionHash,
    });

    const savedPurchase = await purchase.save();

    await Gift.findByIdAndUpdate(purchaseData.giftId, {
      status: "sold",
      soldTo: purchaseData.userId,
      soldAt: new Date(),
    });

    await User.findByIdAndUpdate(purchaseData.userId, {
      $inc: { balance: -price }
    });

    return savedPurchase;
  }

  async getUserPurchases(userId: string): Promise<IPurchase[]> {
    return await Purchase.find({ userId }).sort({ createdAt: -1 });
  }

  async getUserPurchasesWithGifts(userId: string): Promise<any[]> {
    const purchases = await Purchase.find({ userId })
      .populate('gift')
      .sort({ createdAt: -1 })
      .lean();

    return purchases as any[];
  }

  async getAllPurchases(): Promise<IPurchase[]> {
    const purchases = await Purchase.find({})
      .populate('gift')
      .sort({ createdAt: -1 });

    return purchases;
  }

  // Rental operations
  async createRental(rentalData: {
    userId: string;
    giftId: string;
    duration: number;
    startDate: Date;
    endDate: Date;
    totalCost: number;
    status: 'active' | 'completed' | 'cancelled';
  }): Promise<IRental> {
    const gift = await Gift.findById(rentalData.giftId);
    if (!gift) throw new Error("Gift topilmadi");
    if (gift.status === "sold") throw new Error("Gift allaqachon sotilgan");

    if (!rentalData.userId) throw new Error("Foydalanuvchi ID talab qilinadi");

    const user = await User.findById(rentalData.userId);
    if (!user) throw new Error("Foydalanuvchi topilmadi");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + rentalData.duration);

    const totalCost = gift.price * rentalData.duration;

    if (user.balance < totalCost) {
      throw new Error(`Yetarli balans yo'q. Kerak: ${totalCost} TON, Mavjud: ${user.balance} TON`);
    }

    const rental = new Rental({
      userId: rentalData.userId,
      giftId: rentalData.giftId,
      duration: rentalData.duration,
      startDate: startDate,
      endDate: endDate,
      totalCost: totalCost,
      status: rentalData.status || 'active', // Default to active if not provided
    });

    const savedRental = await rental.save();

    await Gift.findByIdAndUpdate(rentalData.giftId, {
      status: "sold",
      soldTo: rentalData.userId,
      soldAt: endDate,
    });

    await User.findByIdAndUpdate(rentalData.userId, {
      $inc: { balance: -totalCost }
    });

    return savedRental;
  }

  async getUserRentals(userId: string, activeOnly = false): Promise<IRental[]> {
    const filter: any = { userId };
    if (activeOnly) {
      filter.status = "active";
    }
    return await Rental.find(filter).sort({ createdAt: -1 });
  }

  async getUserRentalsWithGifts(userId: string, activeOnly = false): Promise<any[]> {
    const filter: any = { userId };
    if (activeOnly) {
      filter.status = "active";
    }
    const rentals = await Rental.find(filter)
      .populate('gift')
      .sort({ createdAt: -1 })
      .lean();

    return rentals as any[];
  }

  async getAllRentals(): Promise<IRental[]> {
    const rentals = await Rental.find({})
      .populate('gift')
      .sort({ createdAt: -1 });

    return rentals;
  }

  async completeRental(rentalId: string): Promise<IRental | null> {
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      { status: "completed" },
      { new: true }
    ).lean() as IRental | null;

    if (rental) {
      await Gift.findByIdAndUpdate(rental.giftId, {
        status: "available",
        $unset: { soldTo: "", soldAt: "" },
      });
    }

    return rental;
  }

  // Stats
  async getStats(): Promise<{
    totalGifts: number;
    activeRentals: number;
    totalUsers: number;
    revenue: number;
  }> {
    const totalGifts = await Gift.countDocuments();
    const activeRentals = await Rental.countDocuments({ status: "active" });
    const totalUsers = await User.countDocuments();
    const rentals = await Rental.find({ status: { $in: ["active", "completed"] } });
    const revenue = rentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);

    return {
      totalGifts,
      activeRentals,
      totalUsers,
      revenue,
    };
  }

  // Admin operations
  async getAllUsers(): Promise<any[]> {
    const users = await User.find({}).lean();

    const usersWithStats = await Promise.all(users.map(async (user) => {
      const rentals = await Rental.find({ userId: user._id }).lean();
      const rentalCount = rentals.length;
      const totalSpent = rentals.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);

      return {
        ...user,
        rentalCount,
        totalSpent
      };
    }));

    return usersWithStats;
  }

  async getUsersWithStats(): Promise<any[]> {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'rentals',
          localField: '_id',
          foreignField: 'userId',
          as: 'rentals'
        }
      },
      {
        $addFields: {
          rentalCount: { $size: '$rentals' },
          totalSpent: {
            $sum: '$rentals.totalCost'
          }
        }
      },
      {
        $project: {
          rentals: 0
        }
      }
    ]);

    return users as any[];
  }

  async updateUserBalanceAdmin(userId: string, amount: number): Promise<IUser | null> {
    const result = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!result) {
      throw new Error("Foydalanuvchi topilmadi");
    }

    return result;
  }

  async cancelRental(rentalId: string): Promise<IRental | null> {
    const rental = await Rental.findById(rentalId);

    if (!rental) {
      throw new Error("Ijara topilmadi");
    }

    if (rental.status !== 'active') {
      throw new Error("Faqat faol ijaralarni bekor qilish mumkin");
    }

    rental.status = 'cancelled';
    await rental.save();

    await Gift.findByIdAndUpdate(rental.giftId, {
      status: 'available',
      $unset: { soldTo: "", soldAt: "" }
    });

    const now = new Date();
    const rentalDoc = rental as any;
    const endDate = new Date(rentalDoc.endDate || now);
    const totalCost = rentalDoc.totalCost || 0;
    const duration = rentalDoc.duration ?? 1;
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const refundAmount = (totalCost / duration) * remainingDays;

    if (refundAmount > 0) {
      await User.findByIdAndUpdate(rental.userId, {
        $inc: { balance: refundAmount }
      });
    }

    return rental;
  }

  // Gift Request operations
  async createGiftRequest(requestData: {
    userId: string;
    giftName: string;
    giftDescription?: string;
    telegramGiftUrl: string;
  }): Promise<IGiftRequest> {
    const user = await User.findById(requestData.userId);
    if (!user) throw new Error("Foydalanuvchi topilmadi");

    const giftRequest = new GiftRequest({
      userId: requestData.userId,
      giftName: requestData.giftName,
      giftDescription: requestData.giftDescription,
      telegramGiftUrl: requestData.telegramGiftUrl,
      status: 'pending',
    });

    return await giftRequest.save();
  }

  async getUserGiftRequests(userId: string): Promise<IGiftRequest[]> {
    return await GiftRequest.find({ userId }).sort({ createdAt: -1 });
  }

  async getAllGiftRequests(): Promise<IGiftRequest[]> {
    return await GiftRequest.find({})
      .populate('userId')
      .sort({ createdAt: -1 });
  }

  async updateGiftRequestStatus(requestId: string, status: "approved" | "rejected", adminNote?: string): Promise<IGiftRequest | null> {
    return await GiftRequest.findByIdAndUpdate(
      requestId,
      { 
        status, 
        adminNote,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId');
  }

  async deleteGiftRequest(requestId: string): Promise<boolean> {
    const result = await GiftRequest.findByIdAndDelete(requestId);
    return result !== null;
  }

  // Maintenance mode operations
  async getMaintenanceMode(): Promise<boolean> {
    const maintenanceDoc = await MaintenanceMode.findOne();
    if (!maintenanceDoc) {
      const newDoc = new MaintenanceMode({ enabled: false });
      await newDoc.save();
      return false;
    }
    return maintenanceDoc.enabled;
  }

  async setMaintenanceMode(enabled: boolean): Promise<boolean> {
    const maintenanceDoc = await MaintenanceMode.findOne();
    if (!maintenanceDoc) {
      const newDoc = new MaintenanceMode({ enabled });
      await newDoc.save();
      return enabled;
    }
    maintenanceDoc.enabled = enabled;
    maintenanceDoc.updatedAt = new Date();
    await maintenanceDoc.save();
    return enabled;
  }
}

export const storage = new MongoStorage();