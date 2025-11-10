import { memo } from "react";
import { Package, User, Settings } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "rent" | "profile" | "admin";
  onTabChange: (tab: "rent" | "profile" | "admin") => void;
  isAdmin?: boolean;
}

const BottomNavigation = memo(function BottomNavigation({ activeTab, onTabChange, isAdmin = false }: BottomNavigationProps) {
  const tabs: Array<{ id: "rent" | "profile" | "admin"; label: string; icon: any }> = [
    { id: "rent", label: "Ijara", icon: Package },
    { id: "profile", label: "Profil", icon: User },
  ];

  if (isAdmin) {
    tabs.push({ id: "admin", label: "Admin", icon: Settings });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 pb-6 px-4 pointer-events-none" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
      <div className="glass-strong rounded-full shadow-2xl max-w-md mx-auto pointer-events-auto overflow-hidden">
        <div className="flex items-center justify-around p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                data-testid={`button-nav-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center px-6 py-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? "scale-105" 
                    : "hover-elevate"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs mt-1 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default BottomNavigation;