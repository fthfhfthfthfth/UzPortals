
import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import FilterBar from "@/components/FilterBar";
import GiftCard from "@/components/GiftCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RentPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "sold">("all");
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const { user, csrfToken } = useAuth();
  const { toast } = useToast();

  const { data: gifts = [], isLoading } = useQuery({
    queryKey: ["/api/gifts", activeFilter],
    queryFn: async () => {
      const params = activeFilter !== "all" ? `?filter=${activeFilter}` : "";
      return await fetch(`/api/gifts${params}`).then(res => res.json());
    },
  });

  const buyMutation = useMutation({
    mutationFn: async (data: { giftId: string }) => {
      if (!csrfToken) {
        throw new Error("CSRF token topilmadi");
      }

      if (!data.giftId) {
        throw new Error("Gift ID talab qilinadi");
      }

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          giftId: data.giftId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Xaridda xatolik");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/me"] });
      setBuyDialogOpen(false);
      toast({
        title: "Muvaffaqiyatli!",
        description: "Gift sotib olindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Sotib olishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleBuy = useCallback((id: string) => {
    const gift = gifts.find((g: any) => g._id === id);
    setSelectedGift(gift);
    setBuyDialogOpen(true);
  }, [gifts]);

  const handleConfirmBuy = useCallback(() => {
    if (!selectedGift) return;
    buyMutation.mutate({
      giftId: selectedGift._id,
    });
  }, [selectedGift, buyMutation]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-10 glass-strong backdrop-blur-xl">
        <div className="p-3 sm:p-4 pt-6 sm:pt-8">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-1 gradient-text">
            UzPortals
          </h1>
          <p className="text-center text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            TON orqali Gift sotib olish
          </p>
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {gifts.map((gift: any) => (
                <GiftCard
                  key={gift._id}
                  id={gift._id}
                  name={gift.name}
                  description={gift.description}
                  lottieUrl={gift.lottieUrl}
                  price={gift.price}
                  status={gift.status}
                  telegramGiftUrl={gift.telegramGiftUrl}
                  onBuy={handleBuy}
                />
              ))}
            </div>

            {gifts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm sm:text-base text-muted-foreground">Hech qanday gift topilmadi</p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Gift sotib olish</DialogTitle>
          </DialogHeader>
          {selectedGift && (
            (() => {
              const insufficientBalance = user ? user.balance < selectedGift.price : false;
              return (
                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-lg font-semibold">{selectedGift.name}</p>
                    {selectedGift.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedGift.description}</p>
                    )}
                  </div>
                  <div className="glass rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Narx:</p>
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56Z" fill="#0098EA"/>
                        <path d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z" fill="white"/>
                      </svg>
                      <p className="text-2xl font-bold gradient-text">
                        {selectedGift.price} TON
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Sizning balansigiz: {user?.balance || 0} TON</p>
                  </div>
                  <Button
                    onClick={handleConfirmBuy}
                    disabled={buyMutation.isPending || insufficientBalance}
                    className="w-full gradient-blue-purple"
                  >
                    {buyMutation.isPending ? "Kutilmoqda..." : insufficientBalance ? "Yetarli balans yo'q" : "Sotib olish"}
                  </Button>
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
