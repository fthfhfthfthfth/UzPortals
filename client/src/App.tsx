import { useState } from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingScreen";
import BottomNavigation from "@/components/BottomNavigation";
import RentPage from "@/pages/RentPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import { MaintenanceMode } from "./components/MaintenanceMode";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rent" | "profile" | "admin">("rent");
  const { isAdmin } = useAuth();

  // Check maintenance mode
  const { data: maintenanceData } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 30000, // Har 30 sekundda tekshirish
  });

  const renderPage = () => {
    switch (activeTab) {
      case "rent":
        return <RentPage />;
      case "profile":
        return <ProfilePage />;
      case "admin":
        return isAdmin ? <AdminPage /> : <RentPage />;
      default:
        return <RentPage />;
    }
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  // Show maintenance mode if enabled and user is not admin
  if (maintenanceData?.enabled && user?.role !== "admin") {
    return <MaintenanceMode />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20" style={{ minHeight: '-webkit-fill-available' }}>
      <div className="max-w-screen-xl mx-auto">
        {renderPage()}
      </div>
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;