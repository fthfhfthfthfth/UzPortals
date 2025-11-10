
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from "telegraf";
import { connectDB } from "../server/db";
import { storage } from "../server/storage";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Handle GET requests (for webhook verification)
    if (req.method === "GET") {
      return res.status(200).json({ 
        status: "Webhook is active", 
        timestamp: new Date().toISOString() 
      });
    }

    // Only handle POST requests for updates
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!BOT_TOKEN) {
      return res.status(500).json({ error: "Bot token not configured" });
    }

    // Connect to database
    await connectDB();

    // Create bot instance
    const bot = new Telegraf(BOT_TOKEN);

    // Register bot commands
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

        const webAppUrl = process.env.WEBAPP_URL || "https://avov.vercel.app";
        
        await ctx.reply(
          `👋 Xush kelibsiz, ${firstName}!\n\n` +
          `🎁 AVOV RENT - Telegram giftlarni ijaraga berish platformasi\n\n` +
          `💰 Balans: ${user.balance} TON\n\n` +
          `Boshlash uchun quyidagi tugmani bosing:`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚀 Ilovani ochish", web_app: { url: webAppUrl } }]
              ]
            }
          }
        );
      } catch (error) {
        console.error("Start command error:", error);
        await ctx.reply("❌ Xatolik yuz berdi. /start ni qayta bosing.");
      }
    });

    bot.command("balance", async (ctx) => {
      try {
        const user = await storage.getUser(ctx.from.id);
        if (!user) {
          await ctx.reply("❌ Foydalanuvchi topilmadi. /start bosing.");
          return;
        }
        await ctx.reply(`💰 Balans: ${user.balance} TON`);
      } catch (error) {
        console.error("Balance command error:", error);
        await ctx.reply("❌ Xatolik yuz berdi.");
      }
    });

    // Handle the update
    await bot.handleUpdate(req.body);
    
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
}
