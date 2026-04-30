"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOwnerListings } from "@/lib/api/client";
import {
  pauseOwnerListing,
  removeOwnerListing,
  resumeOwnerListing
} from "@/lib/api/owner-property-actions";
import type { OwnerListingItemResponse } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

/**
 * Owner property list view — implements UC-010 (list), UC-011 (route to edit),
 * UC-012 (remove + pause/resume), and surfaces FR-20 / FR-21 status semantics.
 */

type StatusFilter = "ALL" | "PUBLISHED" | "PAUSED" | "DRAFT" | "REMOVED";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function statusBadgeClass(status: string) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PUBLISHED" || normalized === "ACTIVE") {
    return "bg-pine/10 text-pine";
  }
  if (normalized === "PAUSED") {
    return "bg-copper/10 text-copper";
  }
  if (normalized === "DRAFT") {
    return "bg-black/10 text-ink/70";
  }
  if (normalized === "REMOVED") {
    return "bg-red-100 text-red-700";
  }
  return "bg-black/10 text-ink/70";
}

function visibleStatusLabel(status: string) {
  const normalized = (status ?? "").toUpperCase();
  if (!normalized || normalized === "ACTIVE") {
    return "PUBLISHED";
  }
  return normalized;
}

export function OwnerListingsExperience() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const accessToken = session?.accessToken;
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const listingsQuery = useQuery({
    queryKey: ["owner-listings-all", accessToken ?? "guest"],
    queryFn: () => getOwnerListings({ page: 0, pageSize: 50 }, accessToken),
    enabled: Boolean(accessToken)
  });

  const items = useMemo(
    () => listingsQuery.data?.items ?? [],
    [listingsQuery.data]
  );

  const filteredItems = useMemo(() => {
    if (filter === "ALL") {
      return items.filter(
        (i) => visibleStatusLabel(i.status) !== "REMOVED"
      );
    }
    return items.filter((i) => visibleStatusLabel(i.status) === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: 0,
      PUBLISHED: 0,
      PAUSED: 0,
      DRAFT: 0,
      REMOVED: 0
    };
    items.forEach((i) => {
      const s = visibleStatusLabel(i.status);
      if (s !== "REMOVED") c.ALL += 1;
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [items]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["owner-listings-all"] });
    queryClient.invalidateQueries({ queryKey: ["owner-listings"] });
  };

  const pauseMutation = useMutation({
    mutationFn: (item: OwnerListingItemResponse) =>
      pauseOwnerListing(item, accessToken),
    onMutate: (item) => setPendingId(item.listingId),
    onSuccess: () => {
      setActionMessage({
        kind: "success",
        text: "Property paused. Tenants will no longer see it in search."
      });
      refresh();
    },
    onError: (error) =>
      setActionMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not pause this property. Please try again."
      }),
    onSettled: () => setPendingId(null)
  });

  const resumeMutation = useMutation({
    mutationFn: (item: OwnerListingItemResponse) =>
      resumeOwnerListing(item, accessToken),
    onMutate: (item) => setPendingId(item.listingId),
    onSuccess: () => {
      setActionMessage({
        kind: "success",
        text: "Property resumed. It will appear in tenant search shortly."
      });
      refresh();
    },
    onError: (error) =>
      setActionMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not resume this property."
      }),
    onSettled: () => setPendingId(null)
  });

  const removeMutation = useMutation({
    mutationFn: (item: OwnerListingItemResponse) =>
      removeOwnerListing(item, accessToken),
    onMutate: (item) => setPendingId(item.listingId),
    onSuccess: () => {
      setActionMessage({
        kind: "success",
        text:
          "Property removed. It is hidden from tenant search and your listings."
      });
      setConfirmRemoveId(null);
      refresh();
    },
    onError: (error) =>
      setActionMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not remove this property."
      }),
    onSettled: () => setPendingId(null)
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <span className="eyebrow-pill">Owner workspace</span>
            <h1 className="mt-4 font-serif text-4xl text-oat md:text-5xl">
              Your properties
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-oat/78">
              Add, list, edit, pause, and remove the properties under your
              account. Published properties appear in the tenant workspace
              search index within 30 seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link className="button-accent" href="/owner/listings/new">
              + Add property
            </Link>
            <Link className="button-secondary" href="/owner/dashboard">
              Owner dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {(
          [
            { key: "ALL", label: "All" },
            { key: "PUBLISHED", label: "Published" },
            { key: "PAUSED", label: "Paused" },
            { key: "DRAFT", label: "Draft" },
            { key: "REMOVED", label: "Removed" }
          ] as Array<{ key: StatusFilter; label: string }>
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              filter === f.key
                ? "border-pine bg-pine text-oat"
                : "border-black/10 bg-white/80 text-ink/70 hover:border-pine/30"
            }`}
            type="button"
          >
            {f.label} · {counts[f.key] ?? 0}
          </button>
        ))}
      </div>

      {actionMessage ? (
        <div
          className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
            actionMessage.kind === "success"
              ? "bg-pine/10 text-pine"
              : "bg-copper/10 text-copper"
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      {!session ? (
        <div className="mt-8 section-panel">
          <p className="text-sm text-ink/72">
            You need to sign in as an owner to view your listings.{" "}
            <Link className="font-semibold text-pine" href="/owner/login">
              Open owner sign-in
            </Link>
            .
          </p>
        </div>
      ) : null}

      {session && listingsQuery.isLoading ? (
        <div className="mt-8 section-panel">
          <p className="text-sm text-ink/72">Loading your properties…</p>
        </div>
      ) : null}

      {session && listingsQuery.isError ? (
        <div className="mt-8 section-panel">
          <p className="text-sm text-copper">
            Could not load your properties.{" "}
            <button
              className="font-semibold underline"
              onClick={() => listingsQuery.refetch()}
              type="button"
            >
              Try again
            </button>
            .
          </p>
        </div>
      ) : null}

      {session && listingsQuery.isSuccess && filteredItems.length === 0 ? (
        <div className="mt-8 section-panel">
          <h2 className="font-serif text-2xl text-ink">
            {filter === "ALL"
              ? "You haven't listed any properties yet"
              : `No properties in "${filter.toLowerCase()}" status`}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            Add your first property using the multi-step form. Once published,
            it will be discoverable by tenants in the tenant workspace.
          </p>
          <div className="mt-5">
            <Link className="button-primary" href="/owner/listings/new">
              + Add your first property
            </Link>
          </div>
        </div>
      ) : null}

      {session && filteredItems.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {filteredItems.map((item) => {
            const status = visibleStatusLabel(item.status);
            const isBusy = pendingId === item.listingId;
            const isConfirmingRemove = confirmRemoveId === item.listingId;
            return (
              <article
                className="section-panel grid gap-4 md:grid-cols-[140px_1fr_auto] md:items-center"
                key={item.listingId}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/5 md:w-[140px]">
                  {item.photos?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover"
                      src={item.photos[0]}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-ink/50">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-2xl text-ink">{item.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusBadgeClass(item.status)}`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/72">
                    {item.bhk} · {item.propertyType} · {item.locality},{" "}
                    {item.city}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {formatCurrency(item.rent)} / month · Deposit{" "}
                    {formatCurrency(item.deposit)}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">
                    Available from {item.availabilityDate} · Listing ID{" "}
                    {item.listingId}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch md:gap-2">
                  <Link
                    className="button-secondary"
                    href={`/properties/${item.listingId}`}
                  >
                    View on tenant site
                  </Link>
                  <Link
                    className="button-secondary"
                    href={`/owner/listings/${item.listingId}/edit`}
                  >
                    Edit
                  </Link>
                  {status === "PAUSED" ? (
                    <button
                      className="button-secondary"
                      disabled={isBusy}
                      onClick={() => resumeMutation.mutate(item)}
                      type="button"
                    >
                      {isBusy && resumeMutation.isPending
                        ? "Resuming…"
                        : "Resume"}
                    </button>
                  ) : status !== "REMOVED" ? (
                    <button
                      className="button-secondary"
                      disabled={isBusy}
                      onClick={() => pauseMutation.mutate(item)}
                      type="button"
                    >
                      {isBusy && pauseMutation.isPending ? "Pausing…" : "Pause"}
                    </button>
                  ) : null}
                  {status !== "REMOVED" && !isConfirmingRemove ? (
                    <button
                      className="button-accent"
                      disabled={isBusy}
                      onClick={() => setConfirmRemoveId(item.listingId)}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                  {isConfirmingRemove ? (
                    <div className="grid gap-2 rounded-2xl bg-copper/10 p-3">
                      <p className="text-xs leading-5 text-copper">
                        Removing hides this property from tenants immediately.
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="button-accent"
                          disabled={isBusy}
                          onClick={() => removeMutation.mutate(item)}
                          type="button"
                        >
                          {isBusy && removeMutation.isPending
                            ? "Removing…"
                            : "Confirm remove"}
                        </button>
                        <button
                          className="button-secondary"
                          disabled={isBusy}
                          onClick={() => setConfirmRemoveId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <div className="mt-10 soft-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Cross-workspace visibility
        </p>
        <p className="mt-3 text-sm leading-6 text-ink/72">
          Properties in <strong>Published</strong> status appear in the tenant
          workspace search and the public landing page within ~30 seconds.{" "}
          <strong>Paused</strong>, <strong>Draft</strong>, and{" "}
          <strong>Removed</strong> properties are hidden from tenants but stay
          visible here on the owner side.
        </p>
      </div>
    </main>
  );
}
