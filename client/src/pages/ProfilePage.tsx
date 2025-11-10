import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ProfileCard from "@/components/ProfileCard";
import RentalHistoryCard from "@/components/RentalHistoryCard";
import DepositDialog from "@/components/DepositDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Gift } from "lucide-react";

export default function ProfilePage() {
  const { user, connectWallet, csrfToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    giftName: "",
    giftDescription: "",
    telegramGiftUrl: "",
  });

  useEffect(() => {
    if (!tonConnectUI) return;

    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet && wallet.account.address) {
        try {
          await connectWallet(wallet.account.address);
          console.log("Wallet connected:", wallet.account.address);
          toast({
            title: "Hamyon ulandi",
            description: "TON hamyon muvaffaqiyatli ulandi",
          });
        } catch (error: any) {
          console.error("Wallet connection failed:", error);
          toast({
            title: "Xatolik",
            description: error.message || "Hamyonni ulashda xatolik",
            variant: "destructive",
          });
        }
      } else if (!wallet && user?.walletAddress) {
        try {
          await connectWallet("");
          console.log("Wallet disconnected");
        } catch (error) {
          console.error("Failed to update wallet disconnection:", error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, user?.walletAddress]);

  const { data: purchases = [], refetch } = useQuery({
    queryKey: ["/api/purchases/me"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/purchases/me", {
        credentials: "include",
      });
      if (!response.ok) {
        console.error("Failed to fetch purchases:", response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const formatPurchases = (Array.isArray(purchases) ? purchases : []).map((purchase: any) => ({
    id: purchase._id,
    giftName: purchase.gift?.name || "Unknown",
    startDate: new Date(purchase.purchaseDate).toLocaleDateString("uz-UZ"),
    endDate: new Date(purchase.purchaseDate).toLocaleDateString("uz-UZ"),
    totalCost: purchase.price,
    status: purchase.status,
  }));

  const activeRentals = purchases.filter((p: any) => p.status === 'completed').length;
  const totalRentals = purchases.length;
  const totalSpent = purchases.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

  const handleConnectWallet = async () => {
    try {
      if (tonAddress) {
        // Disconnect wallet
        await tonConnectUI.disconnect();
        await connectWallet("");
        toast({
          title: "Hamyon uzildi",
          description: "TON hamyon muvaffaqiyatli uzildi",
        });
      } else {
        tonConnectUI.openModal();
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Xatolik",
        description: "Hamyonni uzishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDeposit = () => {
    setDepositDialogOpen(true);
  };

  const requestGiftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const res = await fetch("/api/gift-requests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "So'rov yuborishda xatolik");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-requests/me"] });
      setRequestDialogOpen(false);
      setRequestForm({ giftName: "", giftDescription: "", telegramGiftUrl: "" });
      toast({ title: "Muvaffaqiyatli!", description: "Gift so'rovi yuborildi. Admin ko'rib chiqadi." });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const handleRequestSubmit = () => {
    if (!requestForm.giftName || !requestForm.telegramGiftUrl) {
      toast({ 
        title: "Xatolik", 
        description: "Gift nomi va Telegram URL majburiy", 
        variant: "destructive" 
      });
      return;
    }
    requestGiftMutation.mutate(requestForm);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  console.log('ProfilePage user data:', {
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    balance: user.balance
  });

  return (
    <div className="min-h-screen bg-background pb-32 p-4 pt-6 sm:pt-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text mb-6">Profil</h1>
          <Button
            onClick={() => setRequestDialogOpen(true)}
            className="gradient-blue-purple"
            size="sm"
          >
            <Gift className="w-4 h-4 mr-2" />
            Gift So'rash
          </Button>
        </div>
        
        <ProfileCard
          telegramId={user.telegramId}
          username={user.username}
          firstName={user.firstName}
          lastName={user.lastName}
          balance={user.balance}
          onConnectWallet={handleConnectWallet}
          onDeposit={handleDeposit}
          isWalletConnected={!!tonAddress || !!user.walletAddress}
          tonAddress={tonAddress}
          activeRentals={activeRentals}
          totalRentals={totalRentals}
          totalSpent={totalSpent}
          walletBalance={user.balance}
        />

        <RentalHistoryCard rentals={formatPurchases} />
      </div>

      <DepositDialog 
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onSuccess={() => refetch()}
      />

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Yangi Gift So'rovi</DialogTitle>
            <DialogDescription>
              O'zingiz xohlagan giftni so'rang. Admin ko'rib chiqib, tizimga qo'shishi mumkin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="giftName">Gift Nomi *</Label>
              <Input
                id="giftName"
                value={requestForm.giftName}
                onChange={(e) => setRequestForm({ ...requestForm, giftName: e.target.value })}
                placeholder="Masalan: Premium Heart"
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="giftDescription">Ta'rif (ixtiyoriy)</Label>
              <Textarea
                id="giftDescription"
                value={requestForm.giftDescription}
                onChange={(e) => setRequestForm({ ...requestForm, giftDescription: e.target.value })}
                placeholder="Gift haqida qisqacha ma'lumot..."
                className="glass"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegramGiftUrl">Telegram Gift URL *</Label>
              <Input
                id="telegramGiftUrl"
                value={requestForm.telegramGiftUrl}
                onChange={(e) => setRequestForm({ ...requestForm, telegramGiftUrl: e.target.value })}
                placeholder="https://t.me/nft/..."
                className="glass"
              />
            </div>
            <Button
              onClick={handleRequestSubmit}
              disabled={requestGiftMutation.isPending}
              className="w-full gradient-blue-purple"
            >
              {requestGiftMutation.isPending ? "Yuborilmoqda..." : "So'rov Yuborish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
