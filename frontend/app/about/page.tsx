import { ContentPageShell } from "@/components/sections/content-page-shell";
import { getWebContentPage } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const page = await getWebContentPage("about");
  return <ContentPageShell page={page} />;
}
