import type { MetadataRoute } from "next";
import { searchListings } from "@/lib/api/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://testition.tech";

const SUPPORTED_CITIES = ["Bengaluru", "Pune", "Hyderabad", "NCR-Delhi", "Chennai"];

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
  { url: `${SITE_URL}/search?city=Bengaluru`, changeFrequency: "hourly", priority: 0.9 },
  { url: `${SITE_URL}/account/onboarding`, changeFrequency: "monthly", priority: 0.5 }
];

export const revalidate = 3600; // re-generate sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cityRoutes: MetadataRoute.Sitemap = SUPPORTED_CITIES.map((city) => ({
    url: `${SITE_URL}/search?city=${encodeURIComponent(city)}`,
    changeFrequency: "hourly",
    priority: 0.8
  }));

  // Pull a bounded slice of listings per city. We don't try to be exhaustive —
  // 50 popular listings per city is enough for Google to crawl actively. The
  // search endpoint always returns published-only.
  const listingResults = await Promise.allSettled(
    SUPPORTED_CITIES.map((city) =>
      searchListings({ city, page: 0, pageSize: 50, sortBy: "recommended" })
    )
  );

  const propertyRoutes: MetadataRoute.Sitemap = listingResults.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    return result.value.items.map((item) => ({
      url: `${SITE_URL}/properties/${item.listingId}`,
      changeFrequency: "daily" as const,
      priority: 0.7
    }));
  });

  return [...STATIC_ROUTES, ...cityRoutes, ...propertyRoutes];
}
