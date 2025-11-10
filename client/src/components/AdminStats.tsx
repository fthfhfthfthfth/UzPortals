import { Card } from "@/components/ui/card";
import { Package, Users, TrendingUp, Clock } from "lucide-react";

interface StatsData {
  totalGifts: number;
  activeRentals: number;
  totalUsers: number;
  revenue: number;
}

interface AdminStatsProps {
  stats: StatsData;
}

export default function AdminStats({ stats }: AdminStatsProps) {
  console.log('AdminStats received:', stats);
  
  const statCards = [
    { label: "Jami Giftlar", value: stats.totalGifts, icon: Package, color: "text-blue-400" },
    { label: "Faol Ijaralar", value: stats.activeRentals, icon: Clock, color: "text-purple-400" },
    { label: "Foydalanuvchilar", value: stats.totalUsers, icon: Users, color: "text-emerald-400" },
    { label: "Daromad (TON)", value: stats.revenue, icon: TrendingUp, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index}
            data-testid={`card-stat-${index}`}
            className="glass-strong p-4 border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold gradient-text" data-testid={`text-stat-value-${index}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
}
