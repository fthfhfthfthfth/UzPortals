import { useState } from "react";
import BottomNavigation from "../BottomNavigation";

export default function BottomNavigationExample() {
  const [activeTab, setActiveTab] = useState<"rent" | "profile" | "admin">("rent");

  return (
    <div className="h-screen bg-background">
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isAdmin={true}
      />
    </div>
  );
}
