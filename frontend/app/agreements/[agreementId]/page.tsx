import { RentalAgreementExperience } from "@/components/sections/rental-agreement-experience";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rental Agreement · Testition",
  description: "Digital rental agreement — review, sign, and download."
};

export default function RentalAgreementPage({
  params
}: {
  params: { agreementId: string };
}) {
  return <RentalAgreementExperience agreementId={params.agreementId} />;
}
