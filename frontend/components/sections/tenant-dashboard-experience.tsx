"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CalendarClock, Heart, Wallet } from "lucide-react";
import {
  getCurrentUserProfile,
  getMatches,
  getNewListings,
  getPaymentsDashboard,
  getTenantDashboard,
  getTenantVisits
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function TenantDashboardExperience() {
  const { session } = useAuthStore();
  const accessToken = session?.accessToken;

  const profileQuery = useQuery({
    queryKey: ["tenant-profile", accessToken ?? "guest"],
    queryFn: () => getCurrentUserProfile(accessToken),
    enabled: Boolean(accessToken)
  });

  const dashboardQuery = useQuery({
    queryKey: ["tenant-dashboard", accessToken ?? "guest"],
    queryFn: () => getTenantDashboard(accessToken),
    enabled: Boolean(accessToken)
  });

  const matchesQuery = useQuery({
    queryKey: ["tenant-matches", accessToken ?? "guest"],
    queryFn: () => getMatches({ page: 0, pageSize: 4 }, accessToken),
    enabled: Boolean(accessToken)
  });

  const visitsQuery = useQuery({
    queryKey: ["tenant-visits", accessToken ?? "guest"],
    queryFn: () => getTenantVisits({ page: 0, pageSize: 4 }, accessToken),
    enabled: Boolean(accessToken)
  });

  const discoveryCity = profileQuery.data?.city?.trim() || "Bengaluru";

  const newListingsQuery = useQuery({
    queryKey: ["tenant-new-listings", accessToken ?? "guest", discoveryCity],
    queryFn: () => getNewListings(discoveryCity, 0, 4),
    enabled: Boolean(accessToken)
  });

  const paymentsQuery = useQuery({
    queryKey: ["tenant-payments", accessToken ?? "guest"],
    queryFn: () => getPaymentsDashboard(accessToken),
    enabled: Boolean(accessToken)
  });

  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Renter dashboard</span>
          <h1 className="mt-5 font-serif text-5xl text-oat">Sign in to unlock your renter journey</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-oat/76">
            Your tenant dashboard brings together matches, visits, account readiness, and rent
            payments in one calmer place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/tenant/login">
              Sign in
            </Link>
            <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/account/register">
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const profile = profileQuery.data;
  const resolvedRole = profile?.role ?? session.role ?? null;
  const dashboard = dashboardQuery.data;
  const matches = matchesQuery.data?.items ?? [];
  const visits = visitsQuery.data?.items ?? [];
  const pendingPayments = paymentsQuery.data?.tenantOverview?.upcomingDues ?? [];

  if (!resolvedRole && profileQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-sm text-ink/70">Loading your tenant workspace...</p>
        </section>
      </main>
    );
  }

  if (resolvedRole === "OWNER") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Renter dashboard</p>
          <h1 className="mt-3 font-serif text-4xl text-ink">This account is signed in as an owner</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">
            Owner sessions have their own workspace for listings and collections. Open the owner
            dashboard to manage homes and track incoming payments.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href="/owner/dashboard">
              Open owner dashboard
            </Link>
            <Link className="button-secondary" href="/payments">
              Open payments
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="hero-panel px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-10">
            <span className="eyebrow-pill">Renter dashboard</span>
            <h1 className="mt-6 font-serif text-5xl leading-[1.02] text-oat md:text-6xl">
              {profile?.fullName ? `${profile.fullName}, your renter journey is ready.` : "Your renter journey is ready."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/76">
              Keep discovery, visits, and payments together so the path from shortlist to move-in
              feels connected instead of scattered.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-accent" href="/search">
                Explore homes
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/payments">
                Open payments
              </Link>
            </div>
          </div>

          <div className="dark-panel relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/60">
              Tenant readiness
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Profile completion</p>
                <p className="mt-2 font-serif text-4xl text-oat">{dashboard?.profileCompletion ?? "..." }%</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Pending due</p>
                <p className="mt-2 font-serif text-4xl text-oat">
                  {paymentsQuery.data?.tenantOverview
                    ? formatCurrency(paymentsQuery.data.tenantOverview.pendingAmount)
                    : "..."}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Scheduled visits</p>
                <p className="mt-2 font-serif text-4xl text-oat">{dashboard?.scheduledVisits ?? "..."}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Unread alerts</p>
                <p className="mt-2 font-serif text-4xl text-oat">{dashboard?.alertsSummary.unreadCount ?? "..."}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Saved homes",
            value: dashboard?.savedCount ?? 0,
            icon: Heart
          },
          {
            label: "Best matches",
            value: dashboard?.recommendedCount ?? 0,
            icon: BadgeCheck
          },
          {
            label: "Upcoming visits",
            value: dashboard?.scheduledVisits ?? 0,
            icon: CalendarClock
          },
          {
            label: "Pending payments",
            value: pendingPayments.length,
            icon: Wallet
          }
        ].map((metric) => (
          <div className="section-panel" key={metric.label}>
            <metric.icon className="h-5 w-5 text-copper" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              {metric.label}
            </p>
            <p className="mt-3 font-serif text-4xl text-ink">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 section-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Latest published homes
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Fresh owner listings now visible in your renter journey
            </h2>
          </div>
          <Link className="button-secondary" href={`/search?city=${encodeURIComponent(discoveryCity)}`}>
            Search all in {discoveryCity}
          </Link>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/74">
          When an owner publishes a property from the owner dashboard, it lands here as part of the
          live renter discovery flow. Use this section to spot newly added homes before you start a
          deeper search.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {(newListingsQuery.data?.items ?? []).length > 0 ? (
            (newListingsQuery.data?.items ?? []).map((listing) => (
              <Link
                className="rounded-[28px] border border-black/8 bg-white/88 p-5 shadow-soft transition hover:border-pine/20 hover:bg-white"
                href={`/properties/${listing.listingId}`}
                key={listing.listingId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                      New owner listing
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">{listing.title}</h3>
                    <p className="mt-1 text-sm uppercase tracking-[0.16em] text-pine">
                      {listing.locality}, {listing.city}
                    </p>
                  </div>
                  <p className="rounded-full bg-pine/10 px-4 py-2 text-sm font-semibold text-pine">
                    {formatCurrency(listing.rent)}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/74">
                  {listing.bhk} • {listing.postedLabel}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm leading-6 text-ink/70">
              Newly published homes in {discoveryCity} will appear here as owners add them.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="section-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Best next homes
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Matches tuned to your renter profile</h2>
            </div>
            <Link className="button-secondary" href="/search">
              Search all
            </Link>
          </div>
          <div className="mt-6 grid gap-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <Link
                  className="rounded-[28px] border border-black/8 bg-white/88 p-5 shadow-soft transition hover:border-pine/20 hover:bg-white"
                  href={`/properties/${match.listingId}`}
                  key={match.listingId}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                        Match score {Math.round(match.matchScore * 100)}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-ink">{match.title}</h3>
                      <p className="mt-1 text-sm uppercase tracking-[0.16em] text-pine">
                        {match.locality}, {match.city}
                      </p>
                    </div>
                    <p className="rounded-full bg-pine/10 px-4 py-2 text-sm font-semibold text-pine">
                      {formatCurrency(match.rent)}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/74">{match.matchReason}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-6 text-ink/70">Loading your latest matches...</p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="section-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Payment due
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Stay ahead of booking and rent dues</h2>
              </div>
              <Link className="button-primary" href="/payments">
                Pay now
              </Link>
            </div>
            <div className="mt-6 grid gap-4">
              {pendingPayments.length > 0 ? (
                pendingPayments.slice(0, 3).map((payment) => (
                  <div className="rounded-[24px] border border-black/8 bg-white/86 p-5" key={payment.paymentId}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
                          {payment.paymentLabel}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink">{payment.listingTitle}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          {payment.locality}, {payment.city}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-pine">{formatCurrency(payment.amount)}</p>
                    </div>
                    <p className="mt-4 text-sm text-ink/72">
                      Due {payment.dueDate ?? "soon"} with {payment.ownerName}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-ink/70">
                  No pending payments are waiting right now.
                </p>
              )}
            </div>
          </div>

          <div className="section-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Upcoming visits
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Visits you should keep an eye on</h2>
              </div>
              <Link className="button-secondary" href="/search">
                Book another
              </Link>
            </div>
            <div className="mt-6 grid gap-4">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <div className="rounded-[24px] border border-black/8 bg-white/86 p-5" key={visit.visitId}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
                          {visit.status}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink">{visit.propertySummary.title}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          {visit.propertySummary.locality}, {visit.propertySummary.city}
                        </p>
                      </div>
                      <Link className="text-sm font-semibold text-copper" href={`/properties/${visit.propertySummary.listingId}`}>
                        View home
                      </Link>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-ink/72">
                      {formatDateTime(visit.scheduledAt)} • {visit.slotLabel}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-ink/70">Your scheduled visits will show up here.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 section-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Account readiness</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Keep your profile strong before you move ahead</h2>
          </div>
          <Link className="button-primary" href="/account/onboarding">
            Finish account setup
          </Link>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/74">
          Owners typically respond faster when the renter profile is complete. Keep your ID,
          emergency contact, and preferences updated so visits, KYC, and payment steps feel smoother.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="button-secondary" href="/account/onboarding">
            Open onboarding
          </Link>
          <Link className="button-secondary" href="/payments">
            Review payment history
          </Link>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-copper" href="/search">
            Continue discovering homes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
