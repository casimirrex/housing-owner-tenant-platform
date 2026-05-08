"use client";

import dynamic from "next/dynamic";
import type { SearchMapPin } from "@/lib/api/types";

/**
 * Tier 3 — Map view of search results.
 *
 * Server-side rendering is disabled because Leaflet touches `window` at
 * import time. The actual map lives in search-map-view-client.tsx.
 */
const Inner = dynamic(() => import("./search-map-view-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[640px] items-center justify-center rounded-[24px] border border-dashed border-black/12 bg-white/70">
      <p className="text-sm text-ink/56">Loading map…</p>
    </div>
  )
});

export function SearchMapView({
  pins,
  city
}: {
  pins: SearchMapPin[];
  city: string;
}) {
  return <Inner pins={pins} city={city} />;
}
