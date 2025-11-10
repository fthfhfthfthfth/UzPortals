import { Telegraf, Markup } from "telegraf";
import { storage } from "./storage";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;
const USE_WEBHOOK = process.env.USE_WEBHOOK === "true";
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  console.warn("⚠️ TELEGRAM_BOT_TOKEN not found. Bot functionality will be disabled.");
} else {
  console.log("✅ Telegram bot token found");
}

if (!WEBAPP_URL) {
  console.warn("⚠️ WEBAPP_URL not configured. Using fallback URL.");
}

export function createBot() {
  if (!BOT_TOKEN) {
    return null;
  }

  const bot = new Telegraf(BOT_TOKEN);

  bot.command("start", async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || `user${userId}`;
    const firstName = ctx.from.first_name || "";
    const lastName = ctx.from.last_name || "";

    try {
      let user = await storage.getUser(userId);
      
      if (!user) {
        user = await storage.createUser({
          telegramId: userId,
          username,
          firstName,
          lastName,
        });
      }

      const webAppUrl = process.env.WEBAPP_URL || "https://your-app.replit.app";
      
      await ctx.reply(
        `👋 Xush kelibsiz, ${firstName}!\n\n` +
        `🎁 UzPortals - Telegram giftlarni TON orqali sotib olish platformasi\n\n` +
        `💰 Sizning balansigiz: ${user.balance} TON\n\n` +
        `Quyidagi tugmalar orqali platformadan foydalanishingiz mumkin:`,
        Markup.inlineKeyboard([
          [Markup.button.webApp("🚀 Ilovani ochish", webAppUrl)],
          [Markup.button.callback("💰 Balans", "balance")],
          [Markup.button.callback("📦 Mening ijaralarim", "my_rentals")],
          [Markup.button.callback("❓ Yordam", "help")]
        ])
      );
    } catch (error) {
      console.error("Start command error:", error);
      await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      `📖 UzPortals - Yordam\n\n` +
      `Buyruqlar:\n` +
      `/start - Botni ishga tushirish\n` +
      `/balance - Balansni ko'rish\n` +
      `/purchases - Mening xaridlarim\n` +
      `/help - Yordam\n\n` +
      `Platformada siz Telegram giftlarni TON orqali sotib olishingiz mumkin. ` +
      `Gift sotib olish uchun ilovani oching va kerakli giftni tanlang.`
    );
  });

  bot.command("balance", async (ctx) => {
    try {
      const user = await storage.getUser(ctx.from.id);
      
      if (!user) {
        await ctx.reply("❌ Foydalanuvchi topilmadi. /start bosing.");
        return;
      }

      const webAppUrl = process.env.WEBAPP_URL || "https://your-app.replit.app";
      
      await ctx.reply(
        `💰 Sizning balansigiz: ${user.balance} TON\n\n` +
        `${user.walletAddress ? `🔗 Ulangan hamyon: ${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}` : "⚠️ Hamyon ulanmagan"}`,
        Markup.inlineKeyboard([
          [Markup.button.webApp("💳 Deposit qilish", webAppUrl)]
        ])
      );
    } catch (error) {
      console.error("Balance command error:", error);
      await ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  bot.command("rentals", async (ctx) => {
    try {
      const user = await storage.getUser(ctx.from.id);
      
      if (!user) {
        await ctx.reply("❌ Foydalanuvchi topilmadi. /start bosing.");
        return;
      }

      const rentals = await storage.getUserRentalsWithGifts((user._id as any).toString(), false);
      
      if (rentals.length === 0) {
        await ctx.reply(
          `📦 Sizda hali ijaralar yo'q.\n\n` +
          `Gift ijaraga olish uchun ilovani oching.`,
          Markup.inlineKeyboard([
            [Markup.button.webApp("🎁 Giftlarni ko'rish", process.env.WEBAPP_URL || "https://your-app.replit.app")]
          ])
        );
        return;
      }

      const activeRentals = rentals.filter(r => r.status === 'active');
      const completedRentals = rentals.filter(r => r.status === 'completed');

      let message = `📦 Sizning ijaralaringiz:\n\n`;
      
      if (activeRentals.length > 0) {
        message += `✅ Faol ijaralar (${activeRentals.length}):\n`;
        activeRentals.forEach((rental: any, index: number) => {
          const endDate = new Date(rental.endDate).toLocaleDateString("uz-UZ");
          message += `${index + 1}. ${rental.gift?.name || 'Unknown'} - ${endDate} gacha\n`;
        });
        message += `\n`;
      }

      if (completedRentals.length > 0) {
        message += `📋 Tugallangan ijaralar: ${completedRentals.length}\n`;
      }

      message += `\n💰 Jami sarflangan: ${rentals.reduce((sum: number, r: any) => sum + r.totalCost, 0).toFixed(2)} TON`;

      await ctx.reply(message);
    } catch (error) {
      console.error("Rentals command error:", error);
      await ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  bot.action("balance", async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const user = await storage.getUser(ctx.from.id);
      
      if (!user) {
        await ctx.editMessageText("❌ Foydalanuvchi topilmadi. /start bosing.");
        return;
      }

      const webAppUrl = process.env.WEBAPP_URL || "https://your-app.replit.app";
      
      await ctx.editMessageText(
        `💰 Sizning balansigiz: ${user.balance} TON\n\n` +
        `${user.walletAddress ? `🔗 Ulangan hamyon: ${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}` : "⚠️ Hamyon ulanmagan"}`,
        Markup.inlineKeyboard([
          [Markup.button.webApp("💳 Deposit qilish", webAppUrl)],
          [Markup.button.callback("◀️ Orqaga", "back_to_start")]
        ])
      );
    } catch (error) {
      console.error("Balance action error:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi.");
    }
  });

  bot.action("my_rentals", async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const user = await storage.getUser(ctx.from.id);
      
      if (!user) {
        await ctx.editMessageText("❌ Foydalanuvchi topilmadi. /start bosing.");
        return;
      }

      const rentals = await storage.getUserRentalsWithGifts((user._id as any).toString(), false);
      
      if (rentals.length === 0) {
        await ctx.editMessageText(
          `📦 Sizda hali ijaralar yo'q.\n\n` +
          `Gift ijaraga olish uchun ilovani oching.`,
          Markup.inlineKeyboard([
            [Markup.button.webApp("🎁 Giftlarni ko'rish", process.env.WEBAPP_URL || "https://your-app.replit.app")],
            [Markup.button.callback("◀️ Orqaga", "back_to_start")]
          ])
        );
        return;
      }

      const activeRentals = rentals.filter(r => r.status === 'active');

      let message = `📦 Sizning ijaralaringiz:\n\n`;
      message += `✅ Faol: ${activeRentals.length}\n`;
      message += `📋 Jami: ${rentals.length}\n`;
      message += `💰 Sarflangan: ${rentals.reduce((sum: number, r: any) => sum + r.totalCost, 0).toFixed(2)} TON`;

      await ctx.editMessageText(
        message,
        Markup.inlineKeyboard([
          [Markup.button.webApp("📋 Batafsil ko'rish", process.env.WEBAPP_URL || "https://your-app.replit.app")],
          [Markup.button.callback("◀️ Orqaga", "back_to_start")]
        ])
      );
    } catch (error) {
      console.error("My rentals action error:", error);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi.");
    }
  });

  bot.action("help", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `📖 UzPortals - Yordam\n\n` +
      `Bu platforma orqali siz:\n\n` +
      `🎁 Telegram giftlarni sotib olishingiz\n` +
      `💰 TON orqali to'lov qilishingiz\n` +
      `📊 Xaridlaringizni kuzatishingiz mumkin\n\n` +
      `Boshlanish:\n` +
      `1. Hamyoningizni ulang\n` +
      `2. Balansga TON qo'shing\n` +
      `3. Gift tanlang va sotib oling\n\n` +
      `Yordam kerak bo'lsa, admin bilan bog'laning.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("◀️ Orqaga", "back_to_start")]
      ])
    );
  });

  bot.action("back_to_start", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await storage.getUser(ctx.from.id);
    const webAppUrl = process.env.WEBAPP_URL || "https://ecb50ce7-3730-4171-8c23-81d6ebf4a19b-00-1t0iack08vtgk.janeway.replit.dev/";
    
    await ctx.editMessageText(
      `👋 Xush kelibsiz, ${ctx.from.first_name}!\n\n` +
      `🎁 UzPortals - Telegram giftlarni TON orqali sotib olish platformasi\n\n` +
      `💰 Sizning balansigiz: ${user?.balance || 0} TON\n\n` +
      `Quyidagi tugmalar orqali platformadan foydalanishingiz mumkin:`,
      Markup.inlineKeyboard([
        [Markup.button.webApp("🚀 Ilovani ochish", webAppUrl)],
        [Markup.button.callback("💰 Balans", "balance")],
        [Markup.button.callback("📦 Mening ijaralarim", "my_rentals")],
        [Markup.button.callback("❓ Yordam", "help")]
      ])
    );
  });

  bot.catch((err, ctx) => {
    console.error("Bot error:", err);
    ctx.reply("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
  });

  return bot;
}

export async function sendGiftRequestNotification(
  requestData: {
    giftName: string;
    giftDescription?: string;
    telegramGiftUrl: string;
    username?: string;
    firstName?: string;
  }
) {
  const bot = createBot();
  
  if (!bot) {
    console.log("ℹ️ Bot is not configured. Cannot send notification.");
    return;
  }

  const UZPORA_CHAT_ID = process.env.UZPORA_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_ID;
  
  if (!UZPORA_CHAT_ID) {
    console.log("⚠️ UZPORA_TELEGRAM_ID not configured. Skipping notification.");
    return;
  }

  try {
    const message = 
      `🎁 Yangi Gift So'rovi Tasdiqlandi!\n\n` +
      `📝 Nom: ${requestData.giftName}\n` +
      `👤 Foydalanuvchi: ${requestData.firstName || requestData.username || "Unknown"}\n` +
      `${requestData.giftDescription ? `📄 Ta'rif: ${requestData.giftDescription}\n` : ''}` +
      `🔗 Link: ${requestData.telegramGiftUrl}\n\n` +
      `Admin tomonidan tasdiqlandi va tizimga qo'shilishi mumkin.`;

    await bot.telegram.sendMessage(UZPORA_CHAT_ID, message);
    console.log(`✅ Gift request notification sent to @UzPora`);
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
  }
}

export async function startBot() {
  const bot = createBot();
  
  if (!bot) {
    console.log("ℹ️ Bot is not configured. Skipping bot initialization.");
    return;
  }

  try {
    if (USE_WEBHOOK && WEBHOOK_DOMAIN) {
      console.log(`🌐 Starting bot in webhook mode: ${WEBHOOK_DOMAIN}`);
      await bot.launch({
        webhook: {
          domain: WEBHOOK_DOMAIN,
          port: parseInt(process.env.PORT || '5000', 10),
        },
      });
      console.log("✅ Telegram bot started successfully (webhook mode)");
    } else {
      console.log("🔄 Starting bot in polling mode");
      await bot.launch({
        dropPendingUpdates: true,
      });
      console.log("✅ Telegram bot started successfully (polling mode)");
    }

    const botInfo = await bot.telegram.getMe();
    console.log(`📱 Bot username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);

    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️ Received ${signal}, shutting down bot gracefully...`);
      bot.stop(signal);
    };

    process.once("SIGINT", () => gracefulShutdown("SIGINT"));
    process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error: any) {
    console.error("❌ Failed to start bot:", error.message);
    
    if (error.response?.error_code === 409) {
      console.error("⚠️ Conflict error: Another instance of the bot is already running.");
      console.error("💡 Tip: Stop other instances or wait a few minutes before retrying.");
    } else if (error.code === 'ETELEGRAM' && error.response?.error_code === 401) {
      console.error("⚠️ Unauthorized: Invalid bot token.");
      console.error("💡 Tip: Check your TELEGRAM_BOT_TOKEN environment variable.");
    } else {
      console.error("💡 Tip: Check your network connection and bot configuration.");
    }
    
    throw error;
  }
}
