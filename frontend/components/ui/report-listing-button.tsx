"use client";

import { Flag, Loader2, X } from "lucide-react";
import { useState } from "react";
import { reportProperty } from "@/lib/api/client";
import type { ListingReportReason } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const REASONS: { value: ListingReportReason; label: string }[] = [
  { value: "FAKE_LISTING", label: "Fake / doesn't exist" },
  { value: "WRONG_INFORMATION", label: "Wrong information (price, BHK, area)" },
  { value: "ALREADY_RENTED", label: "Already rented out" },
  { value: "DUPLICATE", label: "Duplicate of another listing" },
  { value: "SCAM_OR_FRAUD", label: "Scam / fraud" },
  { value: "SPAM", label: "Spam" },
  { value: "OFFENSIVE_CONTENT", label: "Offensive / inappropriate content" },
  { value: "OTHER", label: "Something else" }
];

/**
 * "Report this listing" button + modal. Sits inline on property detail page.
 * Submits to POST /api/v1/properties/{id}/report and dedupes existing OPEN
 * reports server-side (returns the existing row).
 */
export function ReportListingButton({ propertyId }: { propertyId: string }) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ListingReportReason>("FAKE_LISTING");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!accessToken) {
      setError("Please sign in to report a listing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reportProperty(propertyId, { reason, details: details || undefined }, accessToken);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    // reset after the modal closes so the next open is clean
    setTimeout(() => {
      setSubmitted(false);
      setError(null);
      setDetails("");
      setReason("FAKE_LISTING");
    }, 200);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65 transition hover:border-rose-300 hover:text-rose-700"
        title="Report this listing"
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
                  Report listing
                </p>
                <h3 className="mt-1 text-xl font-semibold text-ink">
                  Help us keep Testition trustworthy
                </h3>
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
                Thanks for the heads-up. Our moderation team will review this listing
                shortly. You can close this dialog.
              </div>
            ) : (
              <>
                <label className="field-label mt-5 block">
                  Reason
                  <select
                    className="form-control mt-2"
                    value={reason}
                    onChange={(event) => setReason(event.target.value as ListingReportReason)}
                  >
                    {REASONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-label mt-4 block">
                  More details <span className="text-ink/40">(optional)</span>
                  <textarea
                    className="form-control mt-2"
                    rows={4}
                    maxLength={2000}
                    placeholder="What seemed off? E.g. owner asked for advance over phone, photos look fake…"
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                  />
                </label>

                {error ? (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {error}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="button-ghost"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="button-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Flag className="mr-2 h-4 w-4" />
                        Submit report
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
