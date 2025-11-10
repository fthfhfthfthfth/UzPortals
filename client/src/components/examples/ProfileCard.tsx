import ProfileCard from "../ProfileCard";

export default function ProfileCardExample() {
  return (
    <div className="bg-background p-4">
      <ProfileCard
        telegramId={7263354123}
        username="Foydalanuvchi"
        balance={125.5}
        onConnectWallet={() => console.log("Connect wallet clicked")}
        isWalletConnected={false}
      />
    </div>
  );
}
