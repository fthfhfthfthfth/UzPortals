# UzPortals - Telegram Gift Platform

## Overview
UzPortals is a Telegram mini-app for buying Telegram gifts using TON cryptocurrency. The platform allows:
- Admins to add and manage gifts for sale
- Users to purchase gifts via TON payments
- Gift request system where users can request new gifts
- Bot notifications to @UzPora when gift requests are approved
- Maintenance mode that only affects regular users (admins bypass it)

## Recent Changes (November 10, 2025)

### Gift Request System
- **Schema**: Added `GiftRequest` table with fields: id, userId, giftName, giftDescription, telegramGiftUrl, status (pending/approved/rejected), adminNote
- **Storage**: Added CRUD operations for gift requests (`createGiftRequest`, `getAllGiftRequests`, `getUserGiftRequests`, `updateGiftRequestStatus`, `deleteGiftRequest`)
- **API Routes**: 
  - POST `/api/gift-requests` - Submit new request (authenticated, CSRF protected)
  - GET `/api/gift-requests` - List all requests (admin only)
  - GET `/api/gift-requests/me` - User's own requests
  - PUT `/api/gift-requests/:id` - Approve/reject (admin only, CSRF protected)
  - DELETE `/api/gift-requests/:id` - Delete request (admin only, CSRF protected)
- **Admin UI**: Added "So'rovlar" tab in AdminPage to view and manage gift requests
- **User UI**: Added "Gift So'rash" button in ProfilePage with modal form

### App Rebranding
- Changed app name from "AVOV RENT" to "UzPortals"
- Updated in: package.json, client/index.html, server/bot.ts messages
- Updated all references to reflect gift purchasing (not rental)

### Maintenance Mode Enhancement
- Maintenance mode now only blocks regular users
- Admin users (matched by ADMIN_TELEGRAM_ID) bypass maintenance completely
- Allows admins to work on the platform while users see maintenance screen

### Bot Notifications
- Added `sendGiftRequestNotification` function in server/bot.ts
- Sends message to @UzPora (via UZPORA_TELEGRAM_ID env var) when gift request is approved
- Includes gift name, description, Telegram URL, and user info
- Gracefully handles missing configuration

### UI Improvements
- Gift cards already display description when available
- Profile page shows gift request submission interface
- Admin panel shows comprehensive gift request management

## Project Architecture

### Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon)
- **Bot**: Telegraf (Telegram Bot Framework)
- **Blockchain**: TON Connect UI for wallet integration
- **Animations**: Lottie for gift animations

### Key Files
- `shared/schema.ts` - Database schema definitions (Drizzle ORM)
- `server/storage.ts` - Database operations layer
- `server/routes.ts` - API endpoints and middleware
- `server/bot.ts` - Telegram bot logic and notifications
- `client/src/pages/AdminPage.tsx` - Admin panel with tabs (Gifts, Users, Settings, Requests)
- `client/src/pages/ProfilePage.tsx` - User profile with gift request submission
- `client/src/components/GiftCard.tsx` - Gift display component

### Database Tables
- `users` - User accounts (telegramId, username, firstName, lastName, balance, isAdmin)
- `gifts` - Available gifts (name, description, lottieUrl, price, status, telegramGiftUrl)
- `purchases` - Purchase history (userId, giftId, price, purchaseDate, transactionHash)
- `giftRequests` - User gift requests (userId, giftName, giftDescription, telegramGiftUrl, status, adminNote)
- `maintenanceMode` - System maintenance flag (isEnabled)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Bot API token
- `ADMIN_TELEGRAM_ID` - Admin user's Telegram ID
- `UZPORA_TELEGRAM_ID` - @UzPora's Telegram ID for notifications (optional, falls back to ADMIN_TELEGRAM_ID)
- `SESSION_SECRET` - Session encryption secret
- `WEBAPP_URL` - Web app URL for bot buttons

### Authentication & Security
- Telegram Web App authentication using cryptographic signature verification
- CSRF protection on all mutating operations
- Session-based authentication
- Admin-only routes protected by middleware
- All gift request operations require authentication

### User Workflow
1. User opens bot (@YourBot), clicks "Ilovani ochish"
2. Web app loads, user data synced from Telegram
3. User can browse gifts, add balance (TON), purchase gifts
4. User can submit gift requests via Profile page
5. Admin reviews and approves/rejects requests
6. When approved, @UzPora receives notification

### Admin Workflow
1. Admin has full access even during maintenance mode
2. Can add/edit/delete gifts
3. Can view all users and purchases
4. Can enable/disable maintenance mode
5. Can review gift requests and approve/reject them

## User Preferences
- Language: Uzbek (Uzbek Latin script)
- Bot messages in Uzbek
- Simple, clean UI with gradient themes
- TON cryptocurrency for payments

## Known Requirements
- Gifts are purchased (not rented) - one-time payment
- Bot sends notifications to @UzPora when requests are approved
- Maintenance mode should not affect admin users
- All animations stored in `/public` folder
- CSRF protection on all admin actions
