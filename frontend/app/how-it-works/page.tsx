import { ContentPageShell } from "@/components/sections/content-page-shell";
import { getWebContentPage } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const page = await getWebContentPage("how-it-works");
  return <ContentPageShell page={page} />;
}
