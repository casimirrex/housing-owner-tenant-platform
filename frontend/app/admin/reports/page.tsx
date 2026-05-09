"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminActOnReport, adminListReports } from "@/lib/api/client";
import type { AdminReportAction } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const STATUS_FILTERS = ["", "OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"];

export default function AdminReportsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [page, setPage] = useState(0);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports", accessToken, statusFilter, page],
    queryFn: () =>
      adminListReports(
        { status: statusFilter || undefined, page, pageSize: 20 },
        accessToken ?? undefined
      ),
    enabled: Boolean(accessToken)
  });

  const action = useMutation({
    mutationFn: ({
      reportId,
      newStatus
    }: {
      reportId: string;
      newStatus: AdminReportAction;
    }) =>
      adminActOnReport(
        reportId,
        { status: newStatus, resolutionNote: resolutionNote || undefined },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setActiveReportId(null);
      setResolutionNote("");
    }
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Listing reports
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">User-flagged listings</h2>
        </div>

        <label className="field-label">
          Status
          <select
            className="form-control mt-2"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(0);
            }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading reports…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Failed to load reports"}
        </p>
      ) : !data ? null : (
        <>
          <div className="mt-6 grid gap-4">
            {data.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/12 bg-white/60 px-4 py-12 text-center text-sm text-ink/55">
                No reports match this filter.
              </div>
            ) : (
              data.items.map((report) => (
                <article
                  key={report.reportId}
                  className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
                        {report.reason.replace(/_/g, " ")}
                      </p>
                      <Link
                        href={`/properties/${report.listingId}`}
                        target="_blank"
                        className="mt-1 block font-semibold text-pine hover:underline"
                      >
                        {report.listingTitle || report.listingId}
                      </Link>
                      <p className="mt-1 text-xs text-ink/60">
                        Reported by <strong>{report.reporterName || report.reporterUserId}</strong> · {report.createdAt}
                      </p>
                      {report.details ? (
                        <p className="mt-2 text-sm leading-6 text-ink/72">{report.details}</p>
                      ) : null}
                      {report.resolutionNote ? (
                        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                          <strong>Resolution:</strong> {report.resolutionNote}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        report.status === "OPEN"
                          ? "bg-rose-100 text-rose-700"
                          : report.status === "IN_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : report.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-ink/10 text-ink/65"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {report.status === "OPEN" || report.status === "IN_REVIEW" ? (
                    <div className="mt-4 border-t border-black/5 pt-4">
                      {activeReportId === report.reportId ? (
                        <div className="space-y-3">
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Resolution note (optional)…"
                            value={resolutionNote}
                            onChange={(event) => setResolutionNote(event.target.value)}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="button-primary"
                              disabled={action.isPending}
                              onClick={() =>
                                action.mutate({
                                  reportId: report.reportId,
                                  newStatus: "RESOLVED"
                                })
                              }
                            >
                              Mark resolved
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              disabled={action.isPending}
                              onClick={() =>
                                action.mutate({
                                  reportId: report.reportId,
                                  newStatus: "DISMISSED"
                                })
                              }
                            >
                              Dismiss
                            </button>
                            {report.status === "OPEN" ? (
                              <button
                                type="button"
                                className="button-ghost"
                                disabled={action.isPending}
                                onClick={() =>
                                  action.mutate({
                                    reportId: report.reportId,
                                    newStatus: "IN_REVIEW"
                                  })
                                }
                              >
                                Move to in-review
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="button-ghost"
                              onClick={() => {
                                setActiveReportId(null);
                                setResolutionNote("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => setActiveReportId(report.reportId)}
                        >
                          Take action
                        </button>
                      )}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink/65">
            <p>
              Showing {data.items.length} of {data.totalCount.toLocaleString("en-IN")} reports
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
