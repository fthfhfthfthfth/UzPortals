
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from "../../server/db";
import { storage } from "../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

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
    }

    return res.json({
      _id: user._id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      balance: user.balance,
      walletAddress: user.walletAddress,
    });
  } catch (error: any) {
    console.error("Auth error:", error);
    return res.status(500).json({ message: error.message });
  }
}
