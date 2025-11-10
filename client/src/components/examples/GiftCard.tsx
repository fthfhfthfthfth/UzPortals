import GiftCard from "../GiftCard";

export default function GiftCardExample() {
  return (
    <div className="bg-background p-4 max-w-xs">
      <GiftCard
        id="1"
        name="Plush Pepe #604"
        lottieUrl="https://via.placeholder.com/300"
        pricePerDay={5}
        status="available"
        onRent={(id) => console.log(`Renting gift ${id}`)}
      />
    </div>
  );
}
