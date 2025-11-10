# ⚡ Tez Deploy Qilish (5 daqiqada)

## 1️⃣ GitHub'ga Yuklash

```bash
cd UzbekRentBox
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2️⃣ Vercel'da Deploy

1. [vercel.com](https://vercel.com) → Login (GitHub bilan)
2. **"Add New" → "Project"**
3. Repository'ni tanlang → **"Import"**
4. ⚠️ **Root Directory: `UzbekRentBox`** (MAJBURIY!)
5. **Environment Variables** qo'shing:

```env
MONGODB_URI=your_mongodb_uri
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
ADMIN_TELEGRAM_ID=your_telegram_id
MASTER_WALLET_ADDRESS=your_wallet_address
SESSION_SECRET=generate_with_crypto
USE_WEBHOOK=true
NODE_ENV=production
```

SESSION_SECRET yaratish:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. **Deploy** → Kutish (3-5 min)

## 3️⃣ Deployment Protection O'chirish

1. Project Settings → **Deployment Protection**
2. **Vercel Authentication** → OFF
3. Save

## 4️⃣ URL'ni Yangilash

1. Settings → **Environment Variables**
2. Qo'shing:
```env
WEBAPP_URL=https://your-app.vercel.app
WEBHOOK_DOMAIN=https://your-app.vercel.app
```
3. **Redeploy**

## 5️⃣ Telegram Webhook O'rnatish

Brauzerda oching (tokenni almashtiring):
```
https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://your-app.vercel.app/api/webhook
```

Javob: `{"ok":true,"result":true}`

## ✅ Test

1. Telegram'da `/start` yuboring
2. Bot javob berishi kerak
3. "🚀 Ilovani ochish" → Mini App ochiladi

---

**Muammo bo'lsa:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) ko'ring
