import { useRef, useEffect, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Coins, Eye } from "lucide-react";
import Lottie from "lottie-react";

interface GiftCardProps {
  id: string;
  name: string;
  description?: string;
  lottieUrl: string;
  price: number;
  status: "available" | "sold";
  telegramGiftUrl?: string;
  onBuy?: (id: string) => void;
}

const GiftCard = memo(function GiftCard({ 
  id, 
  name, 
  description,
  lottieUrl, 
  price, 
  status, 
  telegramGiftUrl,
  onBuy 
}: GiftCardProps) {
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAvailable = status === "available";

  useEffect(() => {
    if (lottieUrl.endsWith('.json') || lottieUrl.includes('lottie')) {
      fetch(lottieUrl)
        .then(res => res.json())
        .then(data => {
          setAnimationData(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [lottieUrl]);

  const handleBuyClick = () => {
    console.log(`Buy gift ${id}`);
    onBuy?.(id);
  };

  const handleViewGift = () => {
    if (telegramGiftUrl) {
      window.open(telegramGiftUrl, '_blank');
    }
  };

  return (
    <div 
      data-testid={`card-gift-${id}`}
      className="glass rounded-2xl p-3 sm:p-4 hover-elevate transition-all duration-300 overflow-hidden"
    >
      <div className="relative mb-2 sm:mb-3">
        <Badge 
          data-testid={`badge-status-${id}`}
          className={`absolute top-1 sm:top-2 left-1 sm:left-2 z-10 text-xs ${
            isAvailable 
              ? "bg-emerald-500/90 hover:bg-emerald-500" 
              : "bg-amber-500/90 hover:bg-amber-500"
          }`}
        >
          {isAvailable ? "Mavjud" : "Sotilgan"}
        </Badge>
        
        <div className="aspect-square bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center overflow-hidden">
          {animationData ? (
            <Lottie 
              animationData={animationData} 
              loop={true}
              className="w-full h-full"
            />
          ) : isLoading ? (
            <div className="w-16 h-16 gradient-blue-purple rounded-full opacity-50 animate-pulse"></div>
          ) : (
            <div className="w-16 h-16 gradient-blue-purple rounded-full opacity-50"></div>
          )}
        </div>
      </div>

      <h3 data-testid={`text-gift-name-${id}`} className="font-semibold text-sm sm:text-base mb-1 truncate">
        {name}
      </h3>
      
      {description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56Z" fill="#0098EA"/>
              <path d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z" fill="white"/>
            </svg>
            <span className="gradient-text font-bold text-sm sm:text-base">{price}</span>
            <span className="text-xs text-muted-foreground">TON</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          data-testid={`button-buy-${id}`}
          onClick={handleBuyClick}
          disabled={!isAvailable}
          className="flex-1 gradient-blue-purple hover:opacity-90 text-xs sm:text-sm touch-manipulation"
          size="sm"
        >
          {isAvailable ? "Sotib olish" : "Sotilgan"}
        </Button>
        {telegramGiftUrl && (
          <Button
            data-testid={`button-view-${id}`}
            onClick={handleViewGift}
            variant="outline"
            size="sm"
            className="glass hover:bg-white/10 border-white/20 px-3"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

export default GiftCard;
