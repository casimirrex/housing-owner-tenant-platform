"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Heart, Sparkles, X } from "lucide-react";
import { expressInterest } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

const LEAD_PRICE_INR = 49;

/**
 * Tier 1 #3 — Tenant pays Rs 49 from wallet to express interest.
 * Opens from the property detail page. After payment the owner sees
 * the lead in their dashboard inbox with the tenant's contact details.
 */
export function ExpressInterestModal({
  listingId,
  listingTitle,
  ownerName,
  onClose,
  onSent
}: {
  listingId: string;
  listingTitle: string;
  ownerName: string;
  onClose: () => void;
  onSent: (result: { walletBalance: number }) => void;
}) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => expressInterest(listingId, message || null, accessToken),
    onSuccess: (result) => {
      onSent({ walletBalance: result.walletBalance });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not send interest. Please try again.");
    }
  });

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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Express Interest
              </p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Send a paid lead</h2>
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
          Pay <strong>Rs {LEAD_PRICE_INR}</strong> from your wallet to send a high-intent lead
          to <strong className="text-ink">{ownerName}</strong> for{" "}
          <strong className="text-ink">{listingTitle}</strong>.
        </p>

        <ul className="mt-4 space-y-2 rounded-xl bg-sand/55 p-4">
          <li className="flex gap-2 text-sm text-ink/72">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
            <span>Owner sees your name, email, and phone in their inbox</span>
          </li>
          <li className="flex gap-2 text-sm text-ink/72">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
            <span>Optional message helps the owner prioritise your enquiry</span>
          </li>
          <li className="flex gap-2 text-sm text-ink/72">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
            <span>One paid lead per listing per 24 hours (anti-spam)</span>
          </li>
        </ul>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-ink">Message (optional)</span>
          <textarea
            className="form-control mt-2 min-h-[100px]"
            placeholder="Hi! I'm looking to move in by 1st June. Pet friendly?"
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={mutation.isPending}
          />
          <span className="mt-1 block text-xs text-ink/52">{message.length}/1000</span>
        </label>

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
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Sending…" : `Pay Rs ${LEAD_PRICE_INR} & send interest`}
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
      </div>
    </div>
  );
}
