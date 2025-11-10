# AVOV RENT - Telegram Mini App Design Guidelines

## Design Approach
**Reference-Based Approach**: Modern fintech/crypto apps with glassmorphism aesthetics (Phantom Wallet, Rainbow Wallet) combined with Telegram's native design language.

## Core Visual Identity

### Color Palette
- **Primary Background**: #2d2d2d (dark charcoal)
- **Accent Gradients**: Blue-to-purple gradients (e.g., #3b82f6 → #8b5cf6)
- **Glassmorphism Layers**: rgba(255, 255, 255, 0.1) with backdrop-blur-xl
- **Text**: White primary, rgba(255, 255, 255, 0.7) secondary
- **Success/Available**: Emerald green tones
- **Rented/Unavailable**: Amber/orange tones

### Typography
- **Font Family**: Inter or SF Pro
- **Headings**: font-semibold to font-bold, sizes 24px-32px
- **Body**: font-normal, 14px-16px
- **Labels**: font-medium, 12px-14px
- **All text in Uzbek language**

### Spacing System
Tailwind units: **2, 3, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, mb-8)

## Loading Screen
- **Full viewport** centered content
- **Typewriter animation** for "AVOV RENT" text (appears character by character)
- **Delivery box animation**: Subtle floating/bouncing box icon above text
- **Beautiful custom font** for brand name (display serif or modern sans)
- **Gradient background** with subtle animated gradient shift
- **Duration**: 2-3 seconds before fade-out to main app

## Navigation Structure

### Glassmorphism Pill Bottom Navigation
- **Fixed bottom position** with safe-area padding
- **Pill/capsule shape**: Fully rounded (rounded-full), floating above bottom edge
- **Glass effect**: backdrop-blur-lg, border border-white/20, bg-white/10
- **Three tabs**: Rent, Profile, Admin (only visible to admin ID: 7263354123)
- **Active state**: Gradient background fill, icon shifts scale
- **Tab icons**: Simple line icons, no emojis
- **Floating**: mb-6 from bottom, mx-4 from sides, shadow-2xl

## Page Layouts

### RENT Page (Main)
**Grid Layout**: 2-column on mobile (grid-cols-2), 3-column on tablet+ (md:grid-cols-3)

**Gift Cards**:
- **Glassmorphism container**: backdrop-blur-md, bg-white/5, border border-white/10, rounded-2xl
- **Lottie animation area**: aspect-square, displays gift animation from Fragment API
- **Content padding**: p-4
- **Gift name**: font-semibold, text-base
- **Price display**: TON logo + amount, gradient text (bg-gradient-to-r from-blue-400 to-purple-400)
- **Rental period**: Small text, secondary color
- **Status badge**: Floating top-right corner (available: green, rented: amber)
- **CTA button**: Full-width, glassmorphism with gradient border, "Ijaraga olish" text

**Filter Bar**:
- **Horizontal pill tabs** below header
- **Options**: Hammasi / Mavjud / Band qilingan
- **Active tab**: Gradient background, smooth transition

### PROFILE Page
**Vertical layout** with glassmorphism cards, gap-4:

1. **User Info Card**: Avatar placeholder, username, Telegram ID
2. **Balance Card**: Large TON amount display, gradient accent, connect wallet button
3. **Active Rentals Section**: Horizontal scrolling cards with gift previews
4. **Rental History**: Vertical list with gift thumbnails, dates, amounts
5. **Inventory Section**: User's owned gifts ready for rental listing
6. **Statistics Grid**: 2x2 grid showing total rentals, earnings, active items

### ADMIN PANEL
**Dashboard Layout**:
- **Top stats grid**: 4 glassmorphism cards (total gifts, active rentals, total users, revenue)
- **Management sections**: Tabs for Gifts / Rentals / Users
- **Gift Management**: Add button (gradient, fixed bottom-right), table view with edit/delete actions
- **Gift form**: Modal overlay with glassmorphism, Lottie URL input, price input (TON), name field
- **Rentals list**: Timeline view with user info, gift, dates, auto-renewal indicator
- **User list**: Table with Telegram data, rental count, total spent

## Component Specifications

### Glassmorphism Cards
```
Standard card:
- backdrop-blur-lg
- bg-white/10
- border border-white/20
- rounded-2xl
- shadow-xl
- p-6
```

### Buttons
- **Primary**: Gradient background (blue-to-purple), white text, rounded-xl, py-3 px-6
- **Secondary**: Glassmorphism with gradient border, rounded-xl
- **On-image buttons**: backdrop-blur-md background, no hover effects (natural glassmorphism)

### Form Inputs
- **Glass style**: backdrop-blur-sm, bg-white/5, border border-white/20, rounded-lg
- **Focus state**: border-white/40, subtle glow
- **Labels**: Above input, font-medium, text-sm

### Animations
- **Smooth transitions**: transition-all duration-300
- **Card hover**: scale-105 transform
- **Loading states**: Subtle pulse animation
- **Page transitions**: Fade + slide effects
- **Gift Lottie**: Autoplay on card hover/tap

## TON Integration UI
- **Connect Wallet button**: Prominent in profile, TON logo + "Hamyonni ulash" text
- **Payment modal**: Glassmorphism overlay, amount preview, confirmation flow
- **Transaction feedback**: Success/error states with animations
- **Balance display**: Always visible in profile header with refresh icon

## Responsive Behavior
- **Mobile-first**: Single column layouts stack vertically
- **Tablet (md:)**: 2-column grids, expanded navigation
- **Desktop (lg:)**: 3-column grids, sidebar potential for admin

## Images
**No hero images** - This is a Telegram mini app focused on functional UI. Gift previews use Lottie animations from Fragment API, not static images.