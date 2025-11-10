import RentalHistoryCard from "../RentalHistoryCard";

//todo: remove mock functionality
const mockRentals = [
  { id: "1", giftName: "Plush Pepe #604", startDate: "01.01.2025", endDate: "05.01.2025", totalCost: 25, status: "active" as const },
  { id: "2", giftName: "Golden Star #123", startDate: "15.12.2024", endDate: "20.12.2024", totalCost: 40, status: "completed" as const },
];

export default function RentalHistoryCardExample() {
  return (
    <div className="bg-background p-4">
      <RentalHistoryCard rentals={mockRentals} />
    </div>
  );
}
