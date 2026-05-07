"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bell, BookmarkPlus, Check, X } from "lucide-react";
import { createSavedSearch } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Tier 2 #4 — "Save this search" CTA on the /search page.
 * Inline form (no modal) so it's a one-click commitment with no friction.
 *
 * Captures current filters and POSTs to /api/v1/saved-searches.
 * Tenant gets in-app alerts when new listings matching these filters are
 * published.
 */
export function SaveSearchButton({
  city,
  query,
  bhk,
  budgetMax,
  verified
}: {
  city?: string;
  query?: string;
  bhk?: string;
  budgetMax?: number;
  verified?: boolean;
}) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const session = useAuthStore((state) => state.session);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(buildDefaultName(city, query, bhk, budgetMax));
  const [savedSearchId, setSavedSearchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createSavedSearch(
        {
          name: name.trim() || "My saved search",
          city,
          query,
          bhk: bhk ? [bhk] : undefined,
          rentMax: budgetMax,
          verified,
          notificationEmail: session?.email ?? undefined
        },
        accessToken
      ),
    onSuccess: (result) => {
      setSavedSearchId(result.searchId);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not save the search.");
    }
  });

  if (!session) {
    return (
      <Link
        href="/account/login"
        className="inline-flex items-center gap-2 rounded-full border border-pine bg-white px-4 py-2 text-xs font-semibold text-pine hover:bg-pine/8"
      >
        <Bell className="h-3.5 w-3.5" />
        Sign in to save this search
      </Link>
    );
  }

  if (savedSearchId) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        Saved! You&apos;ll get alerts on matches.
        <Link
          href="/account/saved-searches"
          className="ml-1 underline decoration-emerald-400 hover:text-emerald-900"
        >
          Manage
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-pine bg-white px-4 py-2 text-xs font-semibold text-pine hover:bg-pine/8"
      >
        <BookmarkPlus className="h-3.5 w-3.5" />
        Save this search
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-pine bg-white px-2 py-1.5">
      <Bell className="ml-2 h-3.5 w-3.5 text-pine" />
      <input
        type="text"
        className="w-56 bg-transparent text-xs font-semibold text-ink placeholder:text-ink/40 focus:outline-none"
        placeholder="Name this search…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={mutation.isPending}
        maxLength={100}
        autoFocus
      />
      <button
        type="button"
        className="rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        className="rounded-full p-1 text-ink/40 hover:bg-sand hover:text-ink"
        onClick={() => setOpen(false)}
        disabled={mutation.isPending}
        aria-label="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {error ? (
        <p className="basis-full px-2 pb-1 text-[11px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function buildDefaultName(
  city?: string,
  query?: string,
  bhk?: string,
  budgetMax?: number
): string {
  const parts: string[] = [];
  if (bhk) parts.push(bhk);
  parts.push("homes");
  if (query) parts.push(`in ${query}`);
  else if (city) parts.push(`in ${city}`);
  if (budgetMax) parts.push(`under ₹${budgetMax.toLocaleString("en-IN")}`);
  return parts.join(" ");
}
