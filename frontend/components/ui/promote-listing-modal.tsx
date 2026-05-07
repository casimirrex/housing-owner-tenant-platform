"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Rocket, X, Sparkles } from "lucide-react";
import { promoteListing } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Featured Listings — pay-to-promote modal.
 * Owner picks a duration tier (7d / 30d), sees the price, confirms, and we
 * deduct from their wallet via the backend. The parent re-renders the
 * dashboard via onPromoted() so the FEATURED badge appears.
 */

const PRICING: Array<{
  durationDays: 7 | 30;
  label: string;
  price: number;
  perDay: string;
  highlight?: boolean;
}> = [
  { durationDays: 7,  label: "1 week",  price: 99,  perDay: "Rs 14/day" },
  { durationDays: 30, label: "1 month", price: 299, perDay: "Rs 10/day", highlight: true }
];

export function PromoteListingModal({
  listingId,
  listingTitle,
  isFeatured,
  onClose,
  onPromoted
}: {
  listingId: string;
  listingTitle: string;
  isFeatured: boolean;
  onClose: () => void;
  onPromoted: (result: { featuredUntil: string; walletBalance: number }) => void;
}) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [selected, setSelected] = useState<7 | 30>(7);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (durationDays: 7 | 30) => promoteListing(listingId, durationDays, accessToken),
    onSuccess: (result) => {
      onPromoted({
        featuredUntil: result.featuredUntil,
        walletBalance: result.walletBalance
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not promote the listing.");
    }
  });

  const tier = PRICING.find((p) => p.durationDays === selected)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Rocket className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Featured listing
              </p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Promote this listing</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink/40 hover:bg-sand hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-ink/68">
          Boost <strong className="text-ink">{listingTitle}</strong> to the top of tenant search
          results. {isFeatured ? "Already featured? We'll extend the period — no time wasted." : ""}
        </p>

        {/* Tier picker */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {PRICING.map((p) => {
            const isSelected = selected === p.durationDays;
            return (
              <button
                key={p.durationDays}
                type="button"
                onClick={() => setSelected(p.durationDays)}
                disabled={mutation.isPending}
                className={`relative rounded-2xl border-2 p-4 text-left transition ${
                  isSelected
                    ? "border-pine bg-pine/8"
                    : "border-black/12 bg-white hover:border-black/20"
                }`}
              >
                {p.highlight ? (
                  <span className="absolute -top-2 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-navy">
                    Best value
                  </span>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/56">
                  {p.label}
                </p>
                <p className="mt-2 font-serif text-3xl font-semibold text-pine">Rs {p.price}</p>
                <p className="mt-1 text-xs text-ink/52">{p.perDay}</p>
              </button>
            );
          })}
        </div>

        {/* Benefits */}
        <ul className="mt-5 space-y-2 rounded-xl bg-sand/55 p-4">
          <li className="flex gap-2 text-sm text-ink/72">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
            <span>Listed at the top of search results for {tier.label}</span>
          </li>
          <li className="flex gap-2 text-sm text-ink/72">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
            <span>Gold &quot;★ Featured&quot; badge on your card across the app</span>
          </li>
          <li className="flex gap-2 text-sm text-ink/72">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
            <span>Paid from your wallet — no card re-entry</span>
          </li>
        </ul>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="button-primary flex-1"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(selected)}
          >
            {mutation.isPending ? "Promoting…" : `Pay Rs ${tier.price} from wallet`}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-ink/52">
          Cancel anytime before paying. No charge happens until you click pay.
        </p>
      </div>
    </div>
  );
}
