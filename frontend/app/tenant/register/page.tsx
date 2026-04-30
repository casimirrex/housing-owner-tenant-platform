import type { Metadata } from "next";
import { TenantRegistrationExperience } from "@/components/sections/tenant-registration-experience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tenant registration · Housing",
  description:
    "Create a dedicated tenant account to search homes, save shortlists, schedule visits, and pay rent in the tenant workspace."
};

export default function TenantRegisterPage() {
  return <TenantRegistrationExperience />;
}
