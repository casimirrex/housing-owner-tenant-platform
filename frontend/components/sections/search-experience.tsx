"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  LayoutGrid,
  Locate,
  MapPinned,
  SlidersHorizontal,
  X
} from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/listing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SaveSearchButton } from "@/components/ui/save-search-button";
import { SearchMapView } from "@/components/ui/search-map-view";
import {
  getFilterMetadata,
  searchListings,
  searchMap,
  searchNearby
} from "@/lib/api/client";
import type { NearbyResponse, SearchMapPin, SearchMapRequest } from "@/lib/api/types";
import { useSearchStore } from "@/store/search-store";

const CITY_VIEWPORTS: Record<string, Omit<SearchMapRequest, "filters">> = {
  Bengaluru: { northEastLat: 13.1, northEastLng: 77.8, southWestLat: 12.85, southWestLng: 77.5 },
  Pune: { northEastLat: 18.63, northEastLng: 73.99, southWestLat: 18.4, southWestLng: 73.72 },
  Hyderabad: { northEastLat: 17.57, northEastLng: 78.6, southWestLat: 17.28, southWestLng: 78.25 },
  "NCR-Delhi": { northEastLat: 28.82, northEastLng: 77.34, southWestLat: 28.42, southWestLng: 76.92 },
  Chennai: { northEastLat: 13.21, northEastLng: 80.34, southWestLat: 12.87, southWestLng: 80.08 }
};

export function SearchExperience({
  initialCity,
  initialQuery,
  initialBudgetMax,
  initialBhk,
  initialVerified
}: {
  initialCity: string;
  initialQuery: string;
  initialBudgetMax?: number;
  initialBhk?: string;
  initialVerified?: boolean;
}) {
  const router = useRouter();
  const { city, query, budgetMax, bhk, verified, setFilters } = useSearchStore();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [draftBhk, setDraftBhk] = useState(initialBhk ?? "");
  const [draftBudgetMax, setDraftBudgetMax] = useState(initialBudgetMax?.toString() ?? "");
  // Tier 3: List ↔ Map toggle
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // "Near me" geolocation state
  const [nearby, setNearby] = useState<NearbyResponse | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(5);

  const findNearMe = (radiusKm = nearbyRadius) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setNearbyError("Your browser does not support location access.");
      return;
    }
    setNearbyError(null);
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await searchNearby(
            position.coords.latitude,
            position.coords.longitude,
            radiusKm
          );
          setNearby(result);
          setNearbyRadius(radiusKm);
          setViewMode("map");
        } catch (error) {
          setNearbyError(
            error instanceof Error ? error.message : "Could not load nearby homes."
          );
        } finally {
          setNearbyLoading(false);
        }
      },
      (geoError) => {
        setNearbyLoading(false);
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission denied. Allow location in your browser to use Near me."
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? "Could not determine your location. Try again outdoors or with Wi-Fi on."
              : "Locating timed out. Please try again.";
        setNearbyError(message);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    );
  };

  const clearNearMe = () => {
    setNearby(null);
    setNearbyError(null);
  };

  const nearbyPins: SearchMapPin[] =
    nearby?.items.map((item) => ({
      listingId: item.listingId,
      title: item.title,
      locality: item.locality,
      lat: item.lat,
      lng: item.lng,
      rent: item.rent,
      verified: item.verified
    })) ?? [];

  useEffect(() => {
    setFilters({
      city: initialCity,
      query: initialQuery,
      budgetMax: initialBudgetMax,
      bhk: initialBhk,
      verified: initialVerified
    });
    setDraftQuery(initialQuery);
    setDraftBhk(initialBhk ?? "");
    setDraftBudgetMax(initialBudgetMax?.toString() ?? "");
  }, [initialBhk, initialBudgetMax, initialCity, initialQuery, initialVerified, setFilters]);

  const filtersQuery = useQuery({
    queryKey: ["search-metadata", city],
    queryFn: () => getFilterMetadata(city)
  });

  const searchQuery = useQuery({
    queryKey: ["search-results", city, query, budgetMax, bhk, verified],
    queryFn: () =>
      searchListings({
        city,
        query,
        budgetMax,
        bhk,
        verified,
        page: 0,
        pageSize: 9
      })
  });

  const mapQuery = useQuery({
    queryKey: ["search-map", city, budgetMax, bhk, verified],
    queryFn: () =>
      searchMap({
        ...(CITY_VIEWPORTS[city] ?? CITY_VIEWPORTS.Bengaluru),
        filters: {
          city,
          budgetMax,
          bhk,
          verified
        }
      }),
    enabled: !!city
  });

  const applyFilters = () => {
    const next = {
      city,
      query: draftQuery,
      budgetMax: draftBudgetMax ? Number(draftBudgetMax) : undefined,
      bhk: draftBhk || undefined,
      verified
    };

    setFilters(next);
    startTransition(() => {
      const searchParams = new URLSearchParams();
      searchParams.set("city", next.city);
      if (next.query) searchParams.set("query", next.query);
      if (next.budgetMax) searchParams.set("budgetMax", String(next.budgetMax));
      if (next.bhk) searchParams.set("bhk", next.bhk);
      if (next.verified !== undefined) searchParams.set("verified", String(next.verified));
      router.replace(`/search?${searchParams.toString()}`);
    });
  };

  const activeFilters = [
    city ? `City: ${city}` : null,
    query ? `Query: ${query}` : null,
    bhk ? `BHK: ${bhk}` : null,
    budgetMax ? `Budget <= Rs. ${budgetMax.toLocaleString("en-IN")}` : null,
    verified ? "Verified only" : null
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-14">
      <SectionHeading
        body="Designed for high-intent rental search with transparent filtering, map-aware discovery, and clear trust cues instead of a flat list experience."
        eyebrow="Search results"
        title={`${city} homes with flexible filters and a clearer decision flow`}
      />

      <section className="mt-8 section-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Applied view
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-ink">
              {searchQuery.data?.summary.summary ?? "Loading homes..."}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/72">
              Use the filter rail to refine budget, BHK, and verification preferences while the
              page keeps the map view and list cards in sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeFilters.map((filter) => (
              <span className="meta-pill" key={filter}>
                {filter}
              </span>
            ))}
            {nearby ? (
              <button
                onClick={clearNearMe}
                type="button"
                className="meta-pill inline-flex items-center gap-1.5 bg-pine text-white hover:bg-pine/90"
                title="Clear Near me"
              >
                <Locate className="h-3.5 w-3.5" />
                Near me · within {nearby.radiusKm} km
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <SaveSearchButton
              city={city}
              query={query}
              bhk={bhk}
              budgetMax={budgetMax}
              verified={verified}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="section-panel lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Quick filters
            </p>
            <SlidersHorizontal className="h-4 w-4 text-pine" />
          </div>
          <div className="mt-5 grid gap-4">
            <label className="field-label">
              Search phrase
              <input
                className="form-control mt-2"
                onChange={(event) => setDraftQuery(event.target.value)}
                value={draftQuery}
              />
            </label>
            <label className="field-label">
              BHK
              <select
                className="form-control mt-2"
                onChange={(event) => setDraftBhk(event.target.value)}
                value={draftBhk}
              >
                <option value="">All</option>
                {filtersQuery.data?.bhkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Max budget
              <input
                className="form-control mt-2"
                onChange={(event) => setDraftBudgetMax(event.target.value)}
                placeholder="35000"
                value={draftBudgetMax}
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white/70 px-4 py-3 text-sm text-ink/75">
              <input
                checked={verified ?? false}
                onChange={(event) => setFilters({ verified: event.target.checked })}
                type="checkbox"
              />
              Only verified homes
            </label>
            <button
              className="button-primary"
              onClick={applyFilters}
              type="button"
            >
              Apply filters
            </button>
          </div>

          <div className="surface-divider mt-6" />

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Find homes near you
            </p>
            <p className="mt-2 text-xs leading-5 text-ink/60">
              We use your device location to surface listings ranked by distance.
            </p>
            <label className="field-label mt-4 block">
              Search radius
              <select
                className="form-control mt-2"
                value={nearbyRadius}
                onChange={(event) => setNearbyRadius(Number(event.target.value))}
              >
                <option value={1}>Within 1 km</option>
                <option value={3}>Within 3 km</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={20}>Within 20 km</option>
              </select>
            </label>
            <button
              className="button-secondary mt-3 w-full justify-center"
              onClick={() => findNearMe(nearbyRadius)}
              disabled={nearbyLoading}
              type="button"
            >
              <Locate className="mr-2 h-4 w-4" />
              {nearbyLoading ? "Locating…" : "Use my location"}
            </button>
            {nearbyError ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {nearbyError}
              </p>
            ) : null}
            {nearby ? (
              <button
                className="button-ghost mt-3 w-full justify-center"
                onClick={clearNearMe}
                type="button"
              >
                <X className="mr-2 h-4 w-4" />
                Clear "Near me"
              </button>
            ) : null}
          </div>

          <div className="surface-divider mt-6" />
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Quick filter vocabulary
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {filtersQuery.data?.quickFilters.map((quickFilter) => (
                <span className="meta-pill" key={quickFilter}>
                  {quickFilter}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          <section className="section-panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Result summary
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">
                  {searchQuery.data?.summary.summary ?? "Loading homes..."}
                </h3>
                <p className="mt-3 text-sm leading-7 text-ink/72">
                  {searchQuery.data
                    ? `${searchQuery.data.pagination.totalItems} homes found across ${searchQuery.data.pagination.totalPages} pages.`
                    : "Loading list summary..."}
                </p>
              </div>

              {/* Tier 3: List ↔ Map toggle */}
              <div className="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white p-1 shadow-soft">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "list" ? "bg-pine text-white" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "map" ? "bg-pine text-white" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  Map ({mapQuery.data?.pins.length ?? 0})
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="soft-panel">
                <p className="text-xs uppercase tracking-[0.22em] text-copper">Sort mode</p>
                <p className="mt-2 text-base font-semibold text-ink">
                  {searchQuery.data?.summary.sortBy ?? "recommended"}
                </p>
              </div>
              <div className="soft-panel">
                <p className="text-xs uppercase tracking-[0.22em] text-copper">BHK options</p>
                <p className="mt-2 text-base font-semibold text-ink">
                  {filtersQuery.data?.bhkOptions.join(", ") ?? "Loading..."}
                </p>
              </div>
            </div>
          </section>

          {nearby ? (
            <>
              <div className="rounded-2xl border border-pine/20 bg-pine/5 px-4 py-3 text-sm text-ink/75">
                Showing <strong>{nearby.items.length}</strong> homes within{" "}
                <strong>{nearby.radiusKm} km</strong> of your location, sorted by distance.
                {nearby.items.length === 0
                  ? " No homes nearby — try a wider radius."
                  : null}
              </div>
              {viewMode === "map" ? (
                <SearchMapView pins={nearbyPins} city={city} />
              ) : (
                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {nearby.items.map((item) => (
                    <div className="relative" key={item.listingId}>
                      <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-pine px-2.5 py-1 text-xs font-bold text-white shadow-soft">
                        <Locate className="h-3 w-3" />
                        {item.distanceKm.toFixed(1)} km
                      </span>
                      <ListingCard
                        listing={{
                          listingId: item.listingId,
                          title: item.title,
                          locality: item.locality,
                          city: item.city,
                          rent: item.rent,
                          bhk: item.bhk,
                          verified: item.verified,
                          premium: item.premium,
                          featured: item.featured,
                          postedLabel: item.postedLabel,
                          urgencyLabel: item.urgencyLabel
                        }}
                      />
                    </div>
                  ))}
                </section>
              )}
            </>
          ) : viewMode === "map" ? (
            <SearchMapView pins={mapQuery.data?.pins ?? []} city={city} />
          ) : (
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {searchQuery.data?.items.map((listing) => (
                <ListingCard key={listing.listingId} listing={listing} />
              ))}
            </section>
          )}

          <div className="section-panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Need a more guided flow?
              </p>
              <p className="mt-2 text-sm leading-7 text-ink/72">
                Continue into onboarding, shortlist, or property detail to test the full connected
                product journey.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="button-ghost" onClick={applyFilters} type="button">
                Refresh results
              </button>
              <Link className="button-secondary" href="/account/onboarding">
                Open account setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
