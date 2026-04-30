import { WalletExperience } from "@/components/sections/wallet-experience";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wallet — Rent and Beyond",
  description: "Add money to your wallet via Stripe and use it for rent payments, deposits, and booking fees."
};

export default function WalletPage() {
  return <WalletExperience />;
}
