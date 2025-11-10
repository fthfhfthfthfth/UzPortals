import { useState } from "react";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, ArrowDown } from "lucide-react";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const toNano = (amount: number): bigint => {
  return BigInt(Math.floor(amount * 1_000_000_000));
};

export default function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
  const { csrfToken } = useAuth();
  const [amount, setAmount] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const DEPOSIT_ADDRESS = "UQCykymqM_PybUwc569W4AJr9l3OxyFJX5l8coAJqOWLmxgk";

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Xatolik",
        description: "To'g'ri summa kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!userAddress) {
      toast({
        title: "Xatolik",
        description: "Hamyon ulanmagan",
        variant: "destructive",
      });
      tonConnectUI.openModal();
      return;
    }

    if (!csrfToken) {
      toast({
        title: "Xatolik",
        description: "Sessiya tugagan, sahifani yangilang",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: DEPOSIT_ADDRESS,
            amount: toNano(parseFloat(amount)).toString(),
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      console.log("Transaction result:", result);

      // Get wallet info to check network
      const walletInfo = tonConnectUI.wallet;
      const network = walletInfo?.account?.chain || "";

      // Validate mainnet only
      if (network !== "-239") {
        toast({
          title: "Xatolik",
          description: "Faqat mainnet ishlatiladi! Testnet qabul qilinmaydi.",
          variant: "destructive",
        });
        return;
      }

      try {
        const depositResponse = await fetch("/api/users/deposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken || "",
          },
          credentials: "include",
          body: JSON.stringify({
            amount: parseFloat(amount),
            transactionBoc: result.boc,
            network: network,
          }),
        });

        if (!depositResponse.ok) {
          const errorData = await depositResponse.json();
          throw new Error(errorData.message || "Deposit qabul qilinmadi");
        }

        const depositData = await depositResponse.json();
        console.log("Deposit processed:", depositData);

        toast({
          title: "Muvaffaqiyatli!",
          description: `${parseFloat(amount)} TON hisobingizga qo'shildi. Yangi balans: ${depositData.balance} TON`,
        });

        if (onSuccess) {
          onSuccess();
        }

        onOpenChange(false);
        setAmount("1");
      } catch (depositError: any) {
        console.error("Deposit tracking error:", depositError);
        toast({
          title: "Ogohlantirish",
          description: "Tranzaksiya yuborildi, lekin balans yangilanmadi. Admindan so'rang.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Tranzaksiya bajarilmadi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [1, 5, 10, 25, 50];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            TON Deposit
          </DialogTitle>
          <DialogDescription>
            Hisobingizga TON yuborish
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {userAddress ? (
            <>
              <div className="glass rounded-lg p-4 space-y-2">
                <Label className="text-sm text-muted-foreground">Sizning manzil</Label>
                <p className="text-xs font-mono break-all">{userAddress}</p>
                <ArrowDown className="w-4 h-4 mx-auto text-muted-foreground" />
                <Label className="text-sm text-muted-foreground">Deposit manzil</Label>
                <p className="text-xs font-mono break-all">{DEPOSIT_ADDRESS}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Summa (TON)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.1"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1.0"
                  className="bg-input"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className="flex-1 min-w-[60px]"
                  >
                    {preset} TON
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleDeposit}
                disabled={isLoading}
                className="w-full gradient-blue-purple"
              >
                {isLoading ? "Yuborilmoqda..." : `${amount} TON yuborish`}
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Deposit qilish uchun avval hamyonni ulang
              </p>
              <Button
                onClick={() => tonConnectUI.openModal()}
                className="gradient-blue-purple"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Hamyonni ulash
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}