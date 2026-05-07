"use client";

import Link from "next/link";
import type { ListingSummary } from "@/lib/api/types";

export function ListingCard({
  listing,
  cityHref,
}: {
  listing: ListingSummary;
  cityHref?: string;
}) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-soft">
      <div className="border-b border-black/6 bg-sand/40 px-6 py-5">
        <div className="flex flex-wrap gap-2">
          {listing.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-navy shadow-sm">
              ★ Featured
            </span>
          ) : null}
          {listing.verified ? <span className="trust-badge">Verified</span> : null}
          {listing.premium ? <span className="stat-badge">Premium</span> : null}
          {listing.urgencyLabel ? <span className="meta-pill">{listing.urgencyLabel}</span> : null}
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-serif text-3xl leading-tight text-ink">{listing.title}</h3>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-pine">
              {listing.locality}, {listing.city}
            </p>
          </div>

          <div className="rounded-[1.25rem] bg-pine px-4 py-3 text-right text-oat">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-oat/62">
              Monthly rent
            </p>
            <p className="mt-1 font-serif text-xl font-semibold">
              ₹{listing.rent.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="soft-panel">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-copper">
              Layout
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">{listing.bhk}</p>
          </div>
          <div className="soft-panel">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-copper">
              Listed
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">{listing.postedLabel}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[18rem] text-sm leading-6 text-ink/68">
            Quick summary for renters who want pricing and timing upfront.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {cityHref ? (
              <Link className="button-secondary px-4 py-2 text-sm" href={cityHref}>
                Explore city
              </Link>
            ) : null}
            <Link className="button-primary px-4 py-2 text-sm" href={`/properties/${listing.listingId}`}>
              View property
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
