"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Star, X } from "lucide-react";
import { useState } from "react";
import { getReviewEligibility, submitReview } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Tier 0 trust & safety — verified-stay review.
 *
 * Checks /reviews/eligibility on mount; only renders the button when the
 * server says `eligible: true`. The submit endpoint re-validates so even
 * a tampered client cannot bypass the gating.
 */
export function LeaveReviewButton({ propertyId }: { propertyId: string }) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const eligibility = useQuery({
    queryKey: ["review-eligibility", propertyId, accessToken ?? "anon"],
    queryFn: () => getReviewEligibility(propertyId, accessToken ?? undefined),
    enabled: Boolean(accessToken)
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitReview(
        propertyId,
        { rating, headline, comment },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["property-reviews", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["review-eligibility", propertyId] });
    }
  });

  // Don't render the button at all unless logged in and server-eligible.
  if (!accessToken || !eligibility.data?.eligible) return null;

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      submitMutation.reset();
      setSubmitted(false);
      setRating(5);
      setHeadline("");
      setComment("");
    }, 200);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-pine/30 bg-pine/5 px-3 py-1.5 text-xs font-semibold text-pine transition hover:bg-pine/10"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Leave a verified review
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
                  Verified stay
                </p>
                <h3 className="mt-1 text-xl font-semibold text-ink">
                  Share your experience
                </h3>
                <p className="mt-2 text-xs leading-5 text-ink/60">
                  Only users who completed a visit can leave a review — your feedback helps the
                  next renter trust this listing.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-1 text-ink/40 hover:bg-black/5 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                <p className="font-semibold">Thanks — your review is live.</p>
                <p className="mt-1">It will help other renters decide on this home.</p>
              </div>
            ) : (
              <>
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
                    Rating
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value} stars`}
                        className="transition hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            value <= rating ? "fill-amber-400 text-amber-500" : "text-ink/20"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field-label mt-4 block">
                  Headline
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Owner was super responsive…"
                    maxLength={120}
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                  />
                </label>

                <label className="field-label mt-4 block">
                  Your review
                  <textarea
                    className="form-control mt-2"
                    rows={5}
                    minLength={12}
                    maxLength={4000}
                    placeholder="What was the visit like? Did the listing match the photos?"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </label>

                {submitMutation.error ? (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {submitMutation.error instanceof Error
                      ? submitMutation.error.message
                      : "Could not submit your review."}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="button-ghost"
                    disabled={submitMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button-primary"
                    disabled={
                      submitMutation.isPending ||
                      headline.trim().length < 4 ||
                      comment.trim().length < 12
                    }
                    onClick={() => submitMutation.mutate()}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Post review
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
