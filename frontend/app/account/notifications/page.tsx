"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  Calendar,
  Flag,
  Heart,
  MessageCircle,
  ShieldAlert,
  Star,
  Wrench
} from "lucide-react";
import { useMemo, useState } from "react";
import { getNotifications } from "@/lib/api/client";
import type { NotificationItem, NotificationType } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: any; tone: string }
> = {
  SAVED_SEARCH: {
    label: "Saved search",
    icon: Heart,
    tone: "bg-rose-50 text-rose-700 border-rose-200"
  },
  MAINTENANCE_UPDATE: {
    label: "Maintenance",
    icon: Wrench,
    tone: "bg-blue-50 text-blue-700 border-blue-200"
  },
  LEAD_REQUEST: {
    label: "New lead",
    icon: MessageCircle,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  VISIT_UPDATE: {
    label: "Visit",
    icon: Calendar,
    tone: "bg-amber-50 text-amber-800 border-amber-200"
  },
  OWNER_REVIEW: {
    label: "Review",
    icon: Star,
    tone: "bg-violet-50 text-violet-700 border-violet-200"
  },
  LISTING_REPORT: {
    label: "Report",
    icon: ShieldAlert,
    tone: "bg-rose-50 text-rose-700 border-rose-200"
  }
};

const FILTERS: { value: "ALL" | NotificationType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SAVED_SEARCH", label: "Saved search" },
  { value: "MAINTENANCE_UPDATE", label: "Maintenance" },
  { value: "LEAD_REQUEST", label: "Leads" },
  { value: "VISIT_UPDATE", label: "Visits" },
  { value: "OWNER_REVIEW", label: "Reviews" },
  { value: "LISTING_REPORT", label: "Reports" }
];

export default function NotificationsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [filter, setFilter] = useState<"ALL" | NotificationType>("ALL");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["notifications", accessToken],
    queryFn: () => getNotifications(accessToken ?? undefined),
    enabled: Boolean(accessToken),
    refetchInterval: 60_000
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "ALL") return data.items;
    return data.items.filter((n) => n.type === filter);
  }, [data, filter]);

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/60">Sign in to see your notifications.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            <Bell className="mr-1.5 inline h-4 w-4" />
            Notifications
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Everything in one place
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink/65">
            Saved-search matches, maintenance updates, leads, visits, reviews, and listing
            reports — all aggregated here. Refreshes every 60 seconds.
          </p>
        </div>
        {data ? (
          <div className="flex items-center gap-3 text-sm text-ink/65">
            <span>
              <strong className="text-ink">{data.totalCount}</strong> total
            </span>
            <span>·</span>
            <span>
              <strong className="text-rose-700">{data.unreadCount}</strong> unread
            </span>
            <button
              type="button"
              className="button-ghost text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        ) : null}
      </header>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.value
                ? "bg-pine text-white"
                : "border border-black/8 bg-white text-ink/70 hover:border-pine hover:text-pine"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink/60">Loading…</p>
      ) : error ? (
        <p className="mt-8 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load notifications"}
        </p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">All caught up</p>
          <p className="mt-1 text-sm text-ink/55">
            {filter === "ALL"
              ? "Nothing here yet — alerts and updates will show up automatically."
              : "No notifications in this category. Try another filter."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {filtered.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </main>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const meta = TYPE_META[item.type] ?? {
    label: "Update",
    icon: AlertCircle,
    tone: "bg-ink/8 text-ink/65 border-black/10"
  };
  const Icon = meta.icon;
  const high = item.priority === "HIGH";

  return (
    <li>
      <Link
        href={item.href}
        className={`block rounded-2xl border bg-white p-5 shadow-soft transition hover:shadow-md ${
          item.read ? "border-black/8" : "border-pine/30"
        }`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${meta.tone}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}
              >
                {meta.label}
              </span>
              {high ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  <Flag className="h-3 w-3" />
                  Priority
                </span>
              ) : null}
              {!item.read ? (
                <span className="h-2 w-2 rounded-full bg-pine" aria-label="Unread" />
              ) : null}
            </div>
            <h3 className="mt-1 text-base font-semibold text-ink">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-ink/72">{item.body}</p>
            <p className="mt-2 text-[11px] text-ink/45">{item.createdAt}</p>
          </div>
        </div>
      </Link>
    </li>
  );
}
