"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bookmark, Eye, TrendingUp } from "lucide-react";
import { getOwnerAnalytics } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Owner Analytics — read-only panel embedded in the owner dashboard.
 * Shows portfolio totals + per-listing micro-stats (views, saves, 7d trend).
 *
 * Designed to drive premium / promotion upsell:
 *   - "12 views, 0 contacts" → "promote this listing for Rs 99/week"
 *   - "0 views, draft" → "publish to start getting views"
 *
 * Pure read — no writes, no schema changes, no risk to existing flows.
 * If the API call fails we render a small friendly fallback instead of
 * blowing up the whole dashboard.
 */
export function OwnerAnalyticsPanel() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const analyticsQuery = useQuery({
    queryKey: ["owner-analytics", accessToken ?? "guest"],
    queryFn: () => getOwnerAnalytics(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000 // 1 minute — analytics don't need to be live-fresh
  });

  const data = analyticsQuery.data;

  if (analyticsQuery.isLoading) {
    return (
      <section className="section-panel mt-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-copper" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Listing performance
          </p>
        </div>
        <p className="mt-3 text-sm text-ink/52">Loading your analytics…</p>
      </section>
    );
  }

  if (analyticsQuery.isError || !data) {
    return null; // graceful — dashboard keeps working without this section
  }

  const { totals, perListing } = data;

  return (
    <section className="section-panel mt-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-copper" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Listing performance
        </p>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-ink">
        Your portfolio at a glance
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink/68">
        Track how tenants engage with your listings. More views without
        contacts? It might be time to promote them.
      </p>

      {/* ── Top-level metric cards ───────────────────────────────────── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Eye className="h-5 w-5 text-pine" />}
          label="Total views"
          value={totals.totalViews}
          tone="pine"
        />
        <MetricCard
          icon={<Bookmark className="h-5 w-5 text-copper" />}
          label="Total saves"
          value={totals.totalSaves}
          tone="copper"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-pine" />}
          label="Views (last 7 days)"
          value={totals.viewsLast7Days}
          tone="pine"
        />
        <MetricCard
          icon={<BarChart3 className="h-5 w-5 text-navy" />}
          label="Published / Total"
          value={`${totals.publishedListings} / ${totals.totalListings}`}
          tone="navy"
        />
      </div>

      {/* ── Per-listing breakdown ────────────────────────────────────── */}
      {perListing.length > 0 ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/52">
            Per-listing breakdown
          </p>
          <div className="mt-4 grid gap-3">
            {perListing.map((l) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3"
                key={l.listingId}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                  <p className="mt-0.5 text-xs text-ink/56">
                    {l.locality}, {l.city} · {l.status === "PUBLISHED" ? "Published" : l.status}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-xs">
                  <Stat icon={<Eye className="h-3.5 w-3.5" />} value={l.views} suffix="views" />
                  <Stat icon={<Bookmark className="h-3.5 w-3.5" />} value={l.saves} suffix="saves" />
                  <Stat
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                    value={l.viewsLast7Days}
                    suffix="this week"
                    tone={l.viewsLast7Days > 0 ? "pine" : "muted"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-ink/56">
          You don&apos;t have any listings yet. Publish your first property to start seeing
          performance metrics here.
        </p>
      )}
    </section>
  );
}

/* ── Internal pieces ───────────────────────────────────────────────────── */

function MetricCard({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "pine" | "copper" | "navy";
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/52">
          {label}
        </p>
      </div>
      <p className={`mt-3 text-3xl font-semibold ${tone === "navy" ? "text-navy" : tone === "copper" ? "text-copper" : "text-pine"}`}>
        {value}
      </p>
    </div>
  );
}

function Stat({
  icon,
  value,
  suffix,
  tone = "default"
}: {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  tone?: "default" | "pine" | "muted";
}) {
  const colorClass =
    tone === "muted" ? "text-ink/40" : tone === "pine" ? "text-pine" : "text-ink/72";
  return (
    <span className={`flex items-center gap-1 ${colorClass}`}>
      {icon}
      <span className="font-semibold">{value}</span>
      <span className="text-ink/52">{suffix}</span>
    </span>
  );
}
