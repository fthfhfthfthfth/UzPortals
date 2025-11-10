import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
    
    // Auto-release expired rentals on startup
    await autoReleaseExpiredRentals();
    
    // Set up periodic check every hour
    setInterval(autoReleaseExpiredRentals, 60 * 60 * 1000);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function autoReleaseExpiredRentals() {
  try {
    const { Rental, Gift } = await import("@shared/schema");
    const now = new Date();
    
    const expiredRentals = await Rental.find({
      status: "active",
      endDate: { $lte: now }
    });

    for (const rental of expiredRentals) {
      await Rental.findByIdAndUpdate(rental._id, { status: "completed" });
      await Gift.findByIdAndUpdate(rental.giftId, {
        status: "available",
        $unset: { rentedBy: "", rentedUntil: "" }
      });
    }

    if (expiredRentals.length > 0) {
      console.log(`✅ Auto-released ${expiredRentals.length} expired rentals`);
    }
  } catch (error) {
    console.error("❌ Error auto-releasing rentals:", error);
  }
}

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});
