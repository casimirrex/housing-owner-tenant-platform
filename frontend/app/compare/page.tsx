"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  CalendarClock,
  Crown,
  Home,
  IndianRupee,
  MapPin,
  Scale,
  Sparkles,
  X
} from "lucide-react";
import { getPropertyDetail } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { useCompareStore } from "@/store/compare-store";

/**
 * Tier 2 #7 — Compare Properties.
 * Side-by-side view of up to 3 listings the user has saved to compare.
 *
 * Pure client-side: pulls IDs from the compare store, fetches each
 * property in parallel via existing GET /api/v1/properties/{id}.
 * No new backend endpoints.
 */
export default function ComparePage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const { listingIds, remove, clear } = useCompareStore();

  const queries = useQueries({
    queries: listingIds.map((id) => ({
      queryKey: ["property-detail", id, accessToken ?? "guest"],
      queryFn: () => getPropertyDetail(id, accessToken),
      staleTime: 60_000
    }))
  });

  const properties = queries.map((q, idx) => ({
    listingId: listingIds[idx],
    data: q.data,
    isLoading: q.isLoading
  }));

  /* ── Empty state ────────────────────────────────────────────────────── */
  if (listingIds.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <section className="hero-panel px-8 py-12 text-center">
          <span className="eyebrow-pill">Compare properties</span>
          <h1 className="mt-5 font-serif text-4xl text-oat md:text-5xl">
            Pick properties to compare
          </h1>
          <p className="mt-4 text-base leading-7 text-oat/76">
            Add up to 3 properties from search results, then come back here to
            see them side-by-side.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="button-accent" href="/search">
              Browse properties
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* ── Comparison view ────────────────────────────────────────────────── */
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
          <h1 className="mt-3 font-serif text-3xl text-ink md:text-4xl">
            Comparing {listingIds.length} {listingIds.length === 1 ? "property" : "properties"}
          </h1>
          <p className="mt-2 text-sm text-ink/68">
            Side-by-side view. Click a card to open the full property detail.
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-red-600 hover:text-red-800"
        >
          Clear all
        </button>
      </div>

      {/* Property column headers */}
      <div className="mt-8 grid gap-5"
           style={{ gridTemplateColumns: `repeat(${listingIds.length}, minmax(0, 1fr))` }}>
        {properties.map(({ listingId, data, isLoading }) => (
          <div
            key={listingId}
            className="relative rounded-[24px] border border-black/8 bg-white p-5 shadow-soft"
          >
            <button
              type="button"
              onClick={() => remove(listingId)}
              className="absolute right-3 top-3 rounded-full bg-white p-1 text-ink/40 shadow hover:bg-sand hover:text-ink"
              aria-label="Remove from compare"
              title="Remove from compare"
            >
              <X className="h-4 w-4" />
            </button>

            {isLoading ? (
              <div className="space-y-3 pr-8">
                <div className="h-4 w-2/3 animate-pulse rounded bg-sand"></div>
                <div className="h-3 w-1/2 animate-pulse rounded bg-sand"></div>
                <div className="h-12 animate-pulse rounded bg-sand"></div>
              </div>
            ) : !data ? (
              <p className="text-sm text-ink/56 pr-8">Could not load this property.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 pr-8">
                  {data.viewerAccess.viewerRole === "OWNER" || data.ownerInfo?.verifiedOwner ? null : null}
                  {/* Trust pills */}
                </div>
                <h2 className="mt-2 font-serif text-xl leading-snug text-ink line-clamp-2">
                  {data.property.title}
                </h2>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-pine">
                  <MapPin className="h-3 w-3" />
                  {data.property.locality}, {data.property.city}
                </p>
                <div className="mt-4 rounded-2xl bg-pine/8 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-pine/72">
                    Monthly rent
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-pine">
                    Rs {data.pricing.monthlyRent.toLocaleString("en-IN")}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      <div className="mt-8 overflow-x-auto rounded-[24px] border border-black/8 bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            <CompareRow label="Layout" icon={<Home className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.specs.bhk ?? "—"}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Furnishing" icon={<Sparkles className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.specs.furnishing ?? "—"}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Bathrooms" icon={<Bath className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.specs.bathrooms ?? "—"}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Deposit" icon={<IndianRupee className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top font-semibold text-ink">
                  {data?.pricing.securityDeposit
                    ? `Rs ${data.pricing.securityDeposit.toLocaleString("en-IN")}`
                    : "—"}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Available from" icon={<CalendarClock className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.pricing.availableFrom ?? "—"}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Verified listing" icon={<BadgeCheck className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.trustSignals?.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-ink/40">—</span>
                  )}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Verified owner" icon={<BadgeCheck className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.ownerInfo?.verifiedOwner ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      ✓ Verified Owner
                    </span>
                  ) : (
                    <span className="text-ink/40">—</span>
                  )}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Premium listing" icon={<Crown className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId, data }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  {data?.viewerAccess?.premiumActive ? (
                    <span className="text-ink">Yes</span>
                  ) : (
                    <span className="text-ink/40">—</span>
                  )}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Open" icon={<Scale className="h-4 w-4 text-pine" />}>
              {properties.map(({ listingId }) => (
                <td key={listingId} className="px-5 py-4 align-top">
                  <Link
                    href={`/properties/${listingId}`}
                    className="button-secondary px-3 py-1.5 text-xs"
                  >
                    View property →
                  </Link>
                </td>
              ))}
            </CompareRow>
          </tbody>
        </table>
      </div>
    </main>
  );
}

function CompareRow({
  label,
  icon,
  children
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-t border-black/6 first:border-0">
      <th className="w-44 bg-sand/40 px-5 py-4 align-top text-left">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink/56">
          {icon}
          {label}
        </span>
      </th>
      {children}
    </tr>
  );
}
