import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export function verifyTelegramWebAppData(initData: string): {
  valid: boolean;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
} {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");
    
    if (!hash) {
      return { valid: false };
    }

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return { valid: false };
    }

    const userParam = urlParams.get("user");
    if (!userParam) {
      return { valid: false };
    }

    const user = JSON.parse(userParam);
    return { valid: true, user };
  } catch (error) {
    console.error("Telegram auth verification error:", error);
    return { valid: false };
  }
}
