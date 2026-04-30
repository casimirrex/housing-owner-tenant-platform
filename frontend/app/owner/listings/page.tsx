import type { Metadata } from "next";
import { OwnerListingsExperience } from "@/components/sections/owner-listings-experience";
import { RoleGuard } from "@/components/auth/role-guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My properties · Owner workspace",
  description:
    "List, edit, pause, and remove the properties under your owner account. Published properties appear in tenant search within seconds."
};

export default function OwnerListingsPage() {
  return (
    <RoleGuard required="OWNER">
      <OwnerListingsExperience />
    </RoleGuard>
  );
}
