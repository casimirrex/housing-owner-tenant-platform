"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { adminListListings, adminModerateListing } from "@/lib/api/client";
import type { AdminListingStatus } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const STATUS_OPTIONS: AdminListingStatus[] = [
  "PUBLISHED",
  "DRAFT",
  "PAUSED",
  "ARCHIVED",
  "SUSPENDED"
];

export default function AdminListingsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-listings", accessToken, status, onlyFlagged, page],
    queryFn: () =>
      adminListListings(
        { status: status || undefined, onlyFlagged: onlyFlagged || undefined, page, pageSize: 20 },
        accessToken ?? undefined
      ),
    enabled: Boolean(accessToken)
  });

  const moderate = useMutation({
    mutationFn: ({
      listingId,
      newStatus
    }: {
      listingId: string;
      newStatus: AdminListingStatus;
    }) => adminModerateListing(listingId, newStatus, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    }
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Listings moderation
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Review &amp; suspend listings</h2>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="field-label">
            Status
            <select
              className="form-control mt-2"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(0);
              }}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-ink/75">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(event) => {
                setOnlyFlagged(event.target.checked);
                setPage(0);
              }}
            />
            Only flagged
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading listings…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Failed to load listings"}
        </p>
      ) : !data ? null : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-black/8 bg-white shadow-soft">
            <table className="min-w-full text-sm">
              <thead className="bg-canvas/60 text-xs uppercase tracking-wider text-ink/55">
                <tr>
                  <th className="px-4 py-3 text-left">Listing</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Rent</th>
                  <th className="px-4 py-3 text-left">Flags</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((listing) => {
                  const flagged = listing.fraudScore > 0 || listing.openReports > 0;
                  return (
                    <tr key={listing.listingId} className={`border-t border-black/5 ${flagged ? "bg-rose-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/properties/${listing.listingId}`}
                          className="font-semibold text-pine hover:underline"
                          target="_blank"
                        >
                          {listing.title}
                        </Link>
                        <p className="text-xs text-ink/55">
                          {listing.locality}, {listing.city}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink/72">{listing.ownerName || listing.ownerId}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          listing.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-700"
                            : listing.status === "SUSPENDED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-ink/10 text-ink/65"
                        }`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/72">
                        ₹{listing.rent.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {listing.openReports > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              <ShieldAlert className="h-3 w-3" />
                              {listing.openReports} report{listing.openReports > 1 ? "s" : ""}
                            </span>
                          ) : null}
                          {listing.fraudScore > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              fraud {listing.fraudScore}
                            </span>
                          ) : null}
                          {listing.featured ? (
                            <span className="inline-flex items-center rounded-full bg-pine/10 px-2 py-0.5 text-[10px] font-bold text-pine">
                              featured
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="form-control text-xs"
                          value={listing.status}
                          disabled={moderate.isPending}
                          onChange={(event) =>
                            moderate.mutate({
                              listingId: listing.listingId,
                              newStatus: event.target.value as AdminListingStatus
                            })
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/55">
                      No listings match this filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink/65">
            <p>
              Showing {data.items.length} of {data.totalCount.toLocaleString("en-IN")} listings
            </p>
            <div className="flex gap-2">
              <button
                className="button-ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                type="button"
              >
                Previous
              </button>
              <button
                className="button-ghost"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * data.pageSize >= data.totalCount}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
