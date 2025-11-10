
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from "../server/db";
import { storage } from "../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const filter = req.query.filter as "all" | "available" | "rented" | undefined;
    const gifts = await storage.getGifts(filter);
    return res.json(gifts);
  } catch (error: any) {
    console.error("Gifts error:", error);
    return res.status(500).json({ message: error.message });
  }
}
