import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AdminStats from "@/components/AdminStats";
import { Plus, Edit, Trash2, DollarSign, Users, Gift, ShoppingCart, Ban, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const { user, csrfToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch maintenance mode status
  const { data: maintenanceData } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance", { credentials: "include" });
      return res.json();
    },
  });

  // Form states
  const [giftForm, setGiftForm] = useState({
    name: "",
    lottieUrl: "",
    price: "",
    telegramGiftUrl: "",
    description: "",
    available: true,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats", { credentials: "include" });
      return res.json();
    },
  });

  // Fetch gifts
  const { data: gifts = [] } = useQuery({
    queryKey: ["/api/gifts"],
    queryFn: async () => {
      const res = await fetch("/api/gifts", { credentials: "include" });
      return res.json();
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      return res.json();
    },
  });

  // Fetch all rentals
  const { data: allRentals = [] } = useQuery({
    queryKey: ["/api/admin/rentals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals", { credentials: "include" });
      return res.json();
    },
  });

  // Fetch all purchases
  const { data: allPurchases = [] } = useQuery({
    queryKey: ["/api/purchases"],
    queryFn: async () => {
      const res = await fetch("/api/purchases", { credentials: "include" });
      return res.json();
    },
  });

  // Fetch all gift requests
  const { data: giftRequests = [] } = useQuery({
    queryKey: ["/api/gift-requests"],
    queryFn: async () => {
      const res = await fetch("/api/gift-requests", { credentials: "include" });
      return res.json();
    },
  });

  // Create/Update gift mutation
  const giftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const url = editingGift ? `/api/gifts/${editingGift._id}` : "/api/gifts";
      const method = editingGift ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setGiftDialogOpen(false);
      setEditingGift(null);
      setGiftForm({ name: "", lottieUrl: "", price: "", telegramGiftUrl: "", description: "", available: true });
      toast({ title: "Muvaffaqiyatli", description: `Gift ${editingGift ? "yangilandi" : "qo'shildi"}` });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  // Delete gift mutation
  const deleteGiftMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const res = await fetch(`/api/gifts/${id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Muvaffaqiyatli", description: "Gift o'chirildi" });
    },
  });

  // Update user balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const res = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Muvaffaqiyatli", description: "Balans yangilandi" });
    },
  });

  // Cancel rental mutation
  const cancelRentalMutation = useMutation({
    mutationFn: async (rentalId: string) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const res = await fetch(`/api/admin/rentals/${rentalId}/cancel`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      toast({ title: "Muvaffaqiyatli", description: "Ijara bekor qilindi" });
    },
  });

  const handleGiftSubmit = () => {
    giftMutation.mutate({
      ...giftForm,
      price: parseFloat(giftForm.price),
    });
  };

  const handleEditGift = (gift: any) => {
    setEditingGift(gift);
    setGiftForm({
      name: gift.name,
      lottieUrl: gift.lottieUrl,
      price: gift.price.toString(),
      telegramGiftUrl: gift.telegramGiftUrl || "",
      description: gift.description || "",
      available: gift.available,
    });
    setGiftDialogOpen(true);
  };

  const handleAddBalance = async (userId: string) => {
    const amount = prompt("Qo'shiladigan summa (TON):");
    if (amount && !isNaN(parseFloat(amount))) {
      updateBalanceMutation.mutate({ userId, amount: parseFloat(amount) });
    }
  };

  const migrateBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/migrate-balances', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
      });
      if (!response.ok) throw new Error('Migration failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Migration muvaffaqiyatli",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle maintenance mode');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: data.enabled ? "Maintenance mode yoqildi" : "Maintenance mode o'chirildi",
        description: data.enabled 
          ? "Foydalanuvchilar tizimga kira olmaydi" 
          : "Tizim normal ishlaydi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update gift request status mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: string; status: "approved" | "rejected"; adminNote?: string }) => {
      if (!csrfToken) throw new Error("CSRF token topilmadi");
      const res = await fetch(`/api/gift-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ status, adminNote }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-requests"] });
      toast({ 
        title: "Muvaffaqiyatli", 
        description: variables.status === "approved" ? "So'rov tasdiqlandi" : "So'rov rad etildi" 
      });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => toggleMaintenanceMutation.mutate(!maintenanceData?.enabled)}
              disabled={toggleMaintenanceMutation.isPending}
              variant={maintenanceData?.enabled ? "destructive" : "outline"}
              size="sm"
            >
              {maintenanceData?.enabled ? "Maintenance OFF" : "Maintenance ON"}
            </Button>
            <Button
              onClick={() => migrateBalancesMutation.mutate()}
              disabled={migrateBalancesMutation.isPending}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${migrateBalancesMutation.isPending ? 'animate-spin' : ''}`} />
              Balanslarni Yangilash
            </Button>
          </div>
        </div>

        {stats && (
          <AdminStats
            stats={{
              totalGifts: stats.totalGifts,
              activeRentals: stats.totalSales || 0,
              totalUsers: stats.totalUsers,
              revenue: stats.revenue,
            }}
          />
        )}

        <Tabs defaultValue="gifts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="gifts">Giftlar</TabsTrigger>
            <TabsTrigger value="requests">So'rovlar</TabsTrigger>
            <TabsTrigger value="purchases">Sotuvlar</TabsTrigger>
            <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
          </TabsList>

          <TabsContent value="gifts" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingGift(null);
                  setGiftForm({ name: "", lottieUrl: "", price: "", telegramGiftUrl: "", description: "", available: true });
                  setGiftDialogOpen(true);
                }}
                className="gradient-blue-purple"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yangi Gift
              </Button>
            </div>

            <Card className="glass-strong overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Ta'rif</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gifts.map((gift: any) => (
                    <TableRow key={gift._id}>
                      <TableCell className="font-medium">{gift.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{gift.description || "—"}</TableCell>
                      <TableCell>{gift.price} TON</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            gift.status === "available" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {gift.status === "available" ? "Mavjud" : "Sotilgan"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditGift(gift)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("Ushbu giftni o'chirmoqchimisiz?")) {
                                deleteGiftMutation.mutate(gift._id);
                              }
                            }}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card className="glass-strong overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Gift Nomi</TableHead>
                    <TableHead>Ta'rif</TableHead>
                    <TableHead>Telegram URL</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftRequests.map((request: any) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        {request.userId?.firstName || request.userId?.username || "Unknown"}
                      </TableCell>
                      <TableCell>{request.giftName}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.giftDescription || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a href={request.telegramGiftUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          Link
                        </a>
                      </TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            request.status === "pending" 
                              ? "bg-yellow-500/20 text-yellow-400" 
                              : request.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {request.status === "pending" 
                            ? "Kutilmoqda" 
                            : request.status === "approved" 
                            ? "Tasdiqlangan" 
                            : "Rad etilgan"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Ushbu so'rovni tasdiqlamoqchimisiz?")) {
                                  updateRequestMutation.mutate({ 
                                    id: request._id, 
                                    status: "approved",
                                    adminNote: "Tasdiqlandi"
                                  });
                                }
                              }}
                              className="text-green-400"
                            >
                              ✓ Tasdiqlash
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("Rad etish sababi:");
                                if (reason) {
                                  updateRequestMutation.mutate({ 
                                    id: request._id, 
                                    status: "rejected",
                                    adminNote: reason
                                  });
                                }
                              }}
                              className="text-red-400"
                            >
                              ✗ Rad etish
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card className="glass-strong overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gift</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPurchases.map((purchase: any) => (
                    <TableRow key={purchase._id}>
                      <TableCell className="font-medium">{purchase.gift?.name || 'Unknown'}</TableCell>
                      <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString('uz-UZ')}</TableCell>
                      <TableCell>{purchase.price} TON</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            purchase.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {purchase.status === 'completed' ? 'Tugallangan' : 'Kutilmoqda'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="glass-strong overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Telegram ID</TableHead>
                    <TableHead>Balans</TableHead>
                    <TableHead>Xaridlar</TableHead>
                    <TableHead>Sarflangan</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">
                        {u.firstName || u.username || 'Unknown'}
                      </TableCell>
                      <TableCell>{u.telegramId}</TableCell>
                      <TableCell>{u.balance} TON</TableCell>
                      <TableCell>{u.purchaseCount || 0}</TableCell>
                      <TableCell>{u.totalSpent || 0} TON</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddBalance(u._id)}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Balans
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Gift Dialog */}
      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-card-border">
          <DialogHeader>
            <DialogTitle>{editingGift ? "Giftni tahrirlash" : "Yangi Gift"}</DialogTitle>
            <DialogDescription>
              Gift ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nomi</Label>
              <Input
                id="name"
                value={giftForm.name}
                onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                placeholder="Swiss Mountains"
              />
            </div>
            <div>
              <Label htmlFor="description">Ta'rif</Label>
              <Input
                id="description"
                value={giftForm.description}
                onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                placeholder="Gift haqida batafsil ma'lumot"
              />
            </div>
            <div>
              <Label htmlFor="lottieUrl">Lottie URL</Label>
              <Input
                id="lottieUrl"
                value={giftForm.lottieUrl}
                onChange={(e) => setGiftForm({ ...giftForm, lottieUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="price">Narxi (TON)</Label>
              <Input
                id="price"
                type="number"
                step="0.1"
                value={giftForm.price}
                onChange={(e) => setGiftForm({ ...giftForm, price: e.target.value })}
                placeholder="2.5"
              />
            </div>
            <div>
              <Label htmlFor="telegramGiftUrl">Telegram Gift URL (ixtiyoriy)</Label>
              <Input
                id="telegramGiftUrl"
                value={giftForm.telegramGiftUrl}
                onChange={(e) => setGiftForm({ ...giftForm, telegramGiftUrl: e.target.value })}
                placeholder="https://t.me/nft/CookieHeart-52113"
              />
            </div>
            <Button
              onClick={handleGiftSubmit}
              disabled={giftMutation.isPending}
              className="w-full gradient-blue-purple"
            >
              {editingGift ? "Yangilash" : "Qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}