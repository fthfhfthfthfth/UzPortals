import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Package, Clock, Plus } from "lucide-react";

interface ProfileCardProps {
  telegramId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  onConnectWallet?: () => void;
  onDeposit?: () => void;
  isWalletConnected?: boolean;
  tonAddress?: string;
  activeRentals?: number;
  totalRentals?: number;
  totalSpent?: number;
  walletBalance?: number | { ton: number }; // Added walletBalance to props
}

const ProfileCard = memo(function ProfileCard({ 
  telegramId, 
  username,
  firstName,
  lastName,
  balance, 
  onConnectWallet,
  onDeposit,
  isWalletConnected = false,
  tonAddress,
  activeRentals = 0,
  totalRentals = 0,
  totalSpent = 0,
  walletBalance // Destructure walletBalance
}: ProfileCardProps) {
  const displayName = firstName || username;
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || username;

  // Telegram profile picture URL
  const profilePhotoUrl = `https://t.me/i/userpic/320/${username}.jpg`;

  return (
    <Card className="glass-strong p-6 border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-username">{fullName}</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-telegram-id">@{username} • ID: {telegramId}</p>
        </div>
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-white/20">
          <img 
            src={profilePhotoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background with initial
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-purple-500', 'flex', 'items-center', 'justify-center');
              e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-white">${displayName?.charAt(0).toUpperCase() || '?'}</span>`;
            }}
          />
        </div>
      </div>

      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">TON Balans</span>
          <Wallet className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="#0098EA"/>
            <path d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z" fill="white"/>
          </svg>
          <span className="text-3xl font-bold gradient-text" data-testid="text-balance">{balance}</span>
        </div>
      </div>

      {!isWalletConnected ? (
        <Button 
          data-testid="button-connect-wallet"
          onClick={onConnectWallet}
          className="w-full gradient-blue-purple"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Hamyonni ulash
        </Button>
      ) : (
        <div className="space-y-2">
          {tonAddress && (
            <div className="glass rounded-lg p-2 text-xs text-center">
              <p className="text-muted-foreground mb-1">Ulangan manzil:</p>
              <p className="font-mono break-all">{tonAddress.slice(0, 8)}...{tonAddress.slice(-6)}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={onDeposit}
              className="flex-1 gradient-blue-purple"
            >
              <Plus className="w-4 h-4 mr-2" />
              Deposit qilish
            </Button>
            <Button 
              onClick={onConnectWallet}
              variant="outline"
              className="flex-1"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Hamyonni uzish
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center glass rounded-lg p-3">
          <Package className="w-5 h-5 mx-auto mb-1 text-blue-400" />
          <p className="text-2xl font-bold" data-testid="text-active-rentals">{activeRentals}</p>
          <p className="text-xs text-muted-foreground">Faol</p>
        </div>
        <div className="text-center glass rounded-lg p-3">
          <Clock className="w-5 h-5 mx-auto mb-1 text-purple-400" />
          <p className="text-2xl font-bold" data-testid="text-total-rentals">{totalRentals}</p>
          <p className="text-xs text-muted-foreground">Jami</p>
        </div>
        <div className="text-center glass rounded-lg p-3">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
          <p className="text-2xl font-bold" data-testid="text-earnings">{totalSpent.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">TON</p>
        </div>
      </div>
    </Card>
  );
});

export default ProfileCard;