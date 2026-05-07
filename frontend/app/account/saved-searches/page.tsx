"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  BellRing,
  Bookmark,
  Building2,
  Filter,
  IndianRupee,
  MapPin,
  Trash2
} from "lucide-react";
import {
  deleteSavedSearch,
  listSavedSearchAlerts,
  listSavedSearches,
  markAlertRead,
  markAllAlertsRead
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Tier 2 #4 — Saved Searches + Alerts inbox.
 *
 * Two-column page:
 *   • Left: tenant's saved searches (criteria + delete + alert counts)
 *   • Right: recent alerts (newest first; click to open the property)
 */
export default function SavedSearchesPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();

  const searchesQuery = useQuery({
    queryKey: ["saved-searches", accessToken ?? "guest"],
    queryFn: () => listSavedSearches(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000
  });

  const alertsQuery = useQuery({
    queryKey: ["saved-search-alerts", accessToken ?? "guest"],
    queryFn: () => listSavedSearchAlerts(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 15_000
  });

  const deleteMutation = useMutation({
    mutationFn: (searchId: string) => deleteSavedSearch(searchId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["saved-search-alerts", accessToken ?? "guest"] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (alertId: string) => markAlertRead(alertId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["saved-search-alerts", accessToken ?? "guest"] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAlertsRead(accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["saved-search-alerts", accessToken ?? "guest"] });
    }
  });

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="hero-panel px-8 py-10 text-center">
          <span className="eyebrow-pill">Saved searches</span>
          <h1 className="mt-5 font-serif text-4xl text-oat md:text-5xl">
            Sign in to manage saved searches
          </h1>
          <p className="mt-4 text-base leading-7 text-oat/76">
            Saved searches send you in-app alerts when new listings matching your criteria
            are published.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="button-accent" href="/account/login">Sign in</Link>
            <Link className="button-secondary" href="/account/register">Create account</Link>
          </div>
        </section>
      </main>
    );
  }

  const searches = searchesQuery.data ?? [];
  const alerts = alertsQuery.data?.alerts ?? [];
  const unreadCount = alertsQuery.data?.unreadCount ?? 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink"
          >
            ← Back to search
          </Link>
          <h1 className="mt-3 font-serif text-3xl text-ink md:text-4xl">
            Saved searches & alerts
          </h1>
          <p className="mt-2 text-sm text-ink/68">
            We&apos;ll add a row to your alerts whenever a new listing matches one of your
            saved searches.
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-xs font-semibold text-pine hover:text-navy"
          >
            Mark all {unreadCount} as read
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ── Saved searches ─────────────────────────────────────────── */}
        <section className="section-panel">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-copper" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Your saved searches
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {searches.length === 0
              ? "No saved searches yet"
              : `${searches.length} saved search${searches.length === 1 ? "" : "es"}`}
          </h2>

          {searches.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-ink/56">
              Save a search from the <Link href="/search" className="font-semibold text-pine">search page</Link> to start
              receiving alerts here.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {searches.map((s) => (
                <div
                  key={s.searchId}
                  className="rounded-2xl border border-black/8 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{s.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/56">
                        {s.city ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.city}
                          </span>
                        ) : null}
                        {s.bhk && s.bhk.length > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {s.bhk.join(", ")}
                          </span>
                        ) : null}
                        {s.rentMax ? (
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            up to ₹{s.rentMax.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                        {s.verified ? (
                          <span className="inline-flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            verified only
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(s.searchId)}
                      disabled={deleteMutation.isPending}
                      className="rounded-full p-1 text-ink/40 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete saved search"
                      title="Delete this saved search"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full bg-pine/8 px-2 py-0.5 text-pine">
                      {s.totalAlerts} total
                    </span>
                    {s.unreadAlerts > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                        <BellRing className="h-3 w-3" />
                        {s.unreadAlerts} new
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Alerts inbox ───────────────────────────────────────────── */}
        <section className="section-panel">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-copper" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Recent alerts
            </p>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {unreadCount} new
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            New listings matching your searches
          </h2>

          {alerts.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-ink/56">
              No alerts yet. Once an owner publishes a listing matching one of your
              saved searches, it appears here within seconds.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {alerts.map((a) => (
                <div
                  key={a.alertId}
                  className={`rounded-2xl border p-4 transition ${
                    a.status === "NEW"
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-black/8 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/52">
                        Saved search · {a.searchName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">{a.listingTitle}</p>
                      <p className="mt-0.5 text-xs text-ink/56">
                        {a.listingLocality}, {a.listingCity} · {a.listingBhk} · ₹
                        {a.listingRent.toLocaleString("en-IN")}/mo
                      </p>
                    </div>
                    {a.status === "NEW" ? (
                      <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        New
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/properties/${a.listingId}`}
                      onClick={() => a.status === "NEW" && markReadMutation.mutate(a.alertId)}
                      className="inline-flex items-center gap-1 rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-white hover:bg-pine/90"
                    >
                      View property
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    {a.status === "NEW" ? (
                      <button
                        type="button"
                        className="text-xs text-ink/56 hover:text-ink"
                        onClick={() => markReadMutation.mutate(a.alertId)}
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className="text-xs text-ink/40">Read</span>
                    )}
                    <span className="ml-auto text-xs text-ink/52">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
