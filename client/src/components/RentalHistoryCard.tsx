import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Coins } from "lucide-react";

interface Rental {
  id: string;
  giftName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: "active" | "completed";
}

interface RentalHistoryCardProps {
  rentals: Rental[];
}

export default function RentalHistoryCard({ rentals }: RentalHistoryCardProps) {
  return (
    <Card className="glass-strong p-6 border-white/10">
      <h3 className="text-lg font-semibold mb-4">Ijara tarixi</h3>
      
      <div className="space-y-3">
        {rentals.map((rental) => (
          <div 
            key={rental.id}
            data-testid={`rental-item-${rental.id}`}
            className="glass rounded-lg p-4 hover-elevate"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium" data-testid={`text-rental-name-${rental.id}`}>
                  {rental.giftName}
                </h4>
                <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{rental.startDate} - {rental.endDate}</span>
                </div>
              </div>
              <Badge 
                data-testid={`badge-rental-status-${rental.id}`}
                className={rental.status === "active" ? "bg-emerald-500" : "bg-gray-500"}
              >
                {rental.status === "active" ? "Faol" : "Tugagan"}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1 text-sm">
              <Coins className="w-4 h-4 text-blue-400" />
              <span className="gradient-text font-semibold">{rental.totalCost} TON</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
