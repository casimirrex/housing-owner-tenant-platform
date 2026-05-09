"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Home,
  MessageSquareMore,
  ShieldAlert,
  UserCog,
  Users
} from "lucide-react";
import { adminGetStats } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export default function AdminOverviewPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats", accessToken],
    queryFn: () => adminGetStats(accessToken ?? undefined),
    enabled: Boolean(accessToken),
    refetchInterval: 30_000
  });

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading platform stats…</p>;
  }
  if (error) {
    return (
      <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error instanceof Error ? error.message : "Failed to load stats"}
      </p>
    );
  }
  if (!data) return null;

  const cards: { label: string; value: number; icon: any; tone?: "warn" | "ok" }[] = [
    { label: "Total users", value: data.totalUsers, icon: Users },
    { label: "Owners", value: data.totalOwners, icon: UserCog },
    { label: "Tenants", value: data.totalTenants, icon: Users },
    { label: "Listings (all)", value: data.totalListings, icon: Home },
    { label: "Listings published", value: data.publishedListings, icon: Activity, tone: "ok" },
    { label: "Listings flagged", value: data.flaggedListings, icon: ShieldAlert, tone: "warn" },
    { label: "Open reports", value: data.openReports, icon: AlertTriangle, tone: "warn" },
    { label: "Visits (last 7d)", value: data.recentVisits, icon: CalendarClock },
    { label: "Chats (last 7d)", value: data.recentChats, icon: MessageSquareMore }
  ];

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
        Platform overview
      </p>
      <h2 className="mt-2 text-xl font-semibold text-ink">All numbers, real-time</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Refreshed every 30 seconds. Use the tabs above to drill into specific moderation surfaces.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const toneClass =
            card.tone === "warn" && card.value > 0
              ? "border-rose-200 bg-rose-50/40"
              : card.tone === "ok"
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-black/8 bg-white";
          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 shadow-soft ${toneClass}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
                  {card.label}
                </p>
                <Icon className="h-5 w-5 text-ink/45" />
              </div>
              <p className="mt-3 font-serif text-4xl text-ink">
                {card.value.toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
