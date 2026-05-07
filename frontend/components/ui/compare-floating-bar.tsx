"use client";

import Link from "next/link";
import { Scale, X } from "lucide-react";
import { COMPARE_MAX, useCompareStore } from "@/store/compare-store";

/**
 * Tier 2 #7 — Floating bottom-right pill that surfaces the user's
 * current compare list. Hidden when 0 properties selected.
 *
 * Sits on every page so the user can always jump to /compare.
 */
export function CompareFloatingBar() {
  const { listingIds, clear } = useCompareStore();

  if (listingIds.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-black/8 bg-white px-2 py-1.5 shadow-soft">
      <span className="ml-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
        <Scale className="h-3.5 w-3.5 text-navy" />
        {listingIds.length}/{COMPARE_MAX} in compare
      </span>
      <Link
        href="/compare"
        className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-oat hover:bg-pine"
      >
        Compare →
      </Link>
      <button
        type="button"
        onClick={clear}
        className="rounded-full p-1 text-ink/40 hover:bg-sand hover:text-ink"
        aria-label="Clear compare list"
        title="Clear all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
