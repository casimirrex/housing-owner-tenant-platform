import type { Metadata } from "next";
import { OwnerRegistrationExperience } from "@/components/sections/owner-registration-experience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner registration · Housing",
  description:
    "Create a dedicated owner account to add, list, edit, and remove properties — your published properties appear in tenant search within seconds."
};

export default function OwnerRegisterPage() {
  return <OwnerRegistrationExperience />;
}
