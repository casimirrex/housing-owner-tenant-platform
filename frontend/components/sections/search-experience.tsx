"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPinned, SlidersHorizontal } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/listing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SaveSearchButton } from "@/components/ui/save-search-button";
import { getFilterMetadata, searchListings, searchMap } from "@/lib/api/client";
import type { SearchMapRequest } from "@/lib/api/types";
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
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="section-panel">
              <div>
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
            </div>

            <div className="dark-panel">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-oat/60">Map view</p>
                  <p className="mt-2 text-2xl font-semibold text-oat">
                    {mapQuery.data?.pins.length ?? 0} pins, {mapQuery.data?.clusters.length ?? 0} clusters
                  </p>
                </div>
                <MapPinned className="h-6 w-6 text-oat/72" />
              </div>
              <div className="mt-6 grid gap-3">
                {mapQuery.data?.pins.slice(0, 4).map((pin) => (
                  <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3" key={pin.listingId}>
                    <p className="font-semibold text-oat">{pin.title}</p>
                    <p className="mt-1 text-sm text-oat/68">
                      {pin.locality} • Rs. {pin.rent.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {searchQuery.data?.items.map((listing) => (
              <ListingCard key={listing.listingId} listing={listing} />
            ))}
          </section>

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
