"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { getRentabilityScore } from "@/lib/api/client";
import type { RentabilityBand, RentabilityScoreResponse } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const BAND_STYLES: Record<RentabilityBand, { bg: string; text: string; label: string }> = {
  NEW: { bg: "bg-slate-100", text: "text-slate-700", label: "New" },
  POOR: { bg: "bg-rose-100", text: "text-rose-700", label: "Poor" },
  FAIR: { bg: "bg-amber-100", text: "text-amber-800", label: "Fair" },
  GOOD: { bg: "bg-pine/10", text: "text-pine", label: "Good" },
  EXCELLENT: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Excellent" }
};

/**
 * Tenant Rentability Score badge.
 *
 * Visibility:
 *   - "self" mode → tenant viewing own profile, clickable for breakdown
 *   - "owner" mode → owner viewing tenant's lead, requires owner has
 *     an active lead/visit/chat with this tenant (server enforces)
 */
export function RentabilityBadge({
  userId,
  mode = "self",
  compact = false
}: {
  userId: string;
  mode?: "self" | "owner";
  compact?: boolean;
}) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data, isLoading, isError } = useQuery<RentabilityScoreResponse>({
    queryKey: ["rentability-score", userId, accessToken ?? "anon"],
    queryFn: () => getRentabilityScore(userId, accessToken),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000
  });

  if (isLoading) {
    return (
      <span className="inline-flex h-7 w-24 animate-pulse rounded-full bg-slate-100" aria-hidden />
    );
  }
  if (isError || !data) return null;

  const style = BAND_STYLES[data.scoreBand] ?? BAND_STYLES.NEW;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full ${style.bg} ${style.text} px-2 py-0.5 text-xs font-semibold`}
        title={`Rentability ${data.score}/100 — ${style.label}`}
      >
        <ShieldCheck className="h-3 w-3" />
        {data.score}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowBreakdown(true)}
        className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${style.text} px-3 py-1 text-xs font-semibold transition hover:opacity-90`}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Rentability {data.score}/100 · {style.label}
        {mode === "self" ? <TrendingUp className="h-3 w-3 opacity-70" /> : null}
      </button>

      {showBreakdown ? (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowBreakdown(false)}
        >
          <div
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
                  Rentability score
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">
                  {data.score}
                  <span className="ml-1 text-base text-ink/60">/ 100</span>
                </h3>
                <p className="mt-1 text-xs text-ink/56">
                  Band: <span className={`font-semibold ${style.text}`}>{style.label}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakdown(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-black/5 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
                What's behind the score
              </p>
              <ul className="mt-3 space-y-2">
                {data.signals.map((s, i) => {
                  const positive = s.contribution >= 0;
                  return (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-3 rounded-xl border border-black/8 bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{s.label}</p>
                        {s.detail ? (
                          <p className="mt-0.5 text-xs text-ink/56">{s.detail}</p>
                        ) : null}
                      </div>
                      <span
                        className={`flex-shrink-0 text-sm font-semibold ${
                          positive ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {s.contribution}
                      </span>
                    </li>
                  );
                })}
                {data.signals.length === 0 ? (
                  <li className="text-sm text-ink/56">
                    Score is based on the default baseline. Complete your profile and
                    build lease history to climb.
                  </li>
                ) : null}
              </ul>
            </div>

            <p className="mt-5 text-[11px] text-ink/52">
              Last computed: {new Date(data.computedAt).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
