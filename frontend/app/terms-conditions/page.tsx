import { ContentPageShell } from "@/components/sections/content-page-shell";
import { getWebContentPage } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function TermsConditionsPage() {
  const page = await getWebContentPage("terms-conditions");
  return <ContentPageShell page={page} />;
}
