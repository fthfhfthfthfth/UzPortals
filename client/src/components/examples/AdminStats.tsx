import AdminStats from "../AdminStats";

export default function AdminStatsExample() {
  return (
    <div className="bg-background p-4">
      <AdminStats
        stats={{
          totalGifts: 24,
          activeRentals: 8,
          totalUsers: 156,
          revenue: 1240
        }}
      />
    </div>
  );
}
