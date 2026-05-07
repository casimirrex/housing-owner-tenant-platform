"use client";

import { Check, Plus, Scale } from "lucide-react";
import { COMPARE_MAX, useCompareStore } from "@/store/compare-store";

/**
 * Tier 2 #7 — Toggle button: adds/removes a listing to the compare list.
 *
 * Two visual variants:
 *   variant="pill"     — small pill, fits inside listing cards
 *   variant="primary"  — larger CTA, fits on property detail page
 *
 * When already in compare → shows "✓ In Compare" and clicking removes it.
 * When not in compare and slots available → shows "+ Compare".
 * When not in compare and limit reached → shows disabled "Compare full" hint.
 */
export function AddToCompareButton({
  listingId,
  variant = "pill"
}: {
  listingId: string;
  variant?: "pill" | "primary";
}) {
  const { listingIds, add, remove, has } = useCompareStore();
  const inList = has(listingId);
  const limitReached = !inList && listingIds.length >= COMPARE_MAX;

  const onClick = () => {
    if (inList) {
      remove(listingId);
    } else if (!limitReached) {
      add(listingId);
    }
  };

  if (variant === "primary") {
    const baseClass = "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition";
    if (inList) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`${baseClass} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`}
        >
          <Check className="h-4 w-4" />
          In Compare
        </button>
      );
    }
    if (limitReached) {
      return (
        <button
          type="button"
          disabled
          className={`${baseClass} cursor-not-allowed bg-ink/8 text-ink/40`}
          title={`Compare full (${COMPARE_MAX}/${COMPARE_MAX}). Remove one to add this.`}
        >
          <Scale className="h-4 w-4" />
          Compare full ({COMPARE_MAX}/{COMPARE_MAX})
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} bg-navy text-oat hover:bg-pine`}
      >
        <Scale className="h-4 w-4" />
        Add to Compare
      </button>
    );
  }

  // variant === "pill" — for listing cards
  const baseClass = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition";
  if (inList) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
      >
        <Check className="h-3.5 w-3.5" />
        In Compare
      </button>
    );
  }
  if (limitReached) {
    return (
      <button
        type="button"
        disabled
        className={`${baseClass} cursor-not-allowed border-ink/12 bg-ink/4 text-ink/40`}
        title={`Compare full (${COMPARE_MAX}/${COMPARE_MAX})`}
      >
        <Scale className="h-3.5 w-3.5" />
        Full
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} border-black/12 bg-white text-ink hover:bg-sand`}
    >
      <Plus className="h-3.5 w-3.5" />
      Compare
    </button>
  );
}
