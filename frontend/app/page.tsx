import { HomeExperience } from "@/components/sections/home-experience";
import { getHome } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const home = await getHome("Bengaluru");
  return <HomeExperience home={home} />;
}
