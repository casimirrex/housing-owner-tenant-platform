"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { useState } from "react";
import { adminListAuditLog } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export default function AdminAuditLogPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-audit-log", accessToken, actionFilter, page],
    queryFn: () =>
      adminListAuditLog(
        { action: actionFilter || undefined, page, pageSize: 50 },
        accessToken ?? undefined
      ),
    enabled: Boolean(accessToken)
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            <ScrollText className="mr-1.5 inline h-4 w-4" />
            Audit log
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            Who did what, when
          </h2>
          <p className="mt-2 text-sm text-ink/65">
            Append-only record of admin and user actions. Used for dispute
            resolution and compliance.
          </p>
        </div>
        <input
          className="form-control"
          placeholder="Filter by action (e.g. WALLET_REFUND)"
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(0);
          }}
        />
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load"}
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-12 text-center">
          <ScrollText className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">No audit entries yet</p>
          <p className="mt-1 text-sm text-ink/55">
            Actions performed in the admin dashboard will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-black/8 bg-white shadow-soft">
            <table className="min-w-full text-sm">
              <thead className="bg-canvas/60 text-xs uppercase tracking-wider text-ink/55">
                <tr>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Actor</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Entity</th>
                  <th className="px-3 py-2 text-left">Payload</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.auditId} className="border-t border-black/5">
                    <td className="px-3 py-2 text-xs text-ink/55">{item.createdAt}</td>
                    <td className="px-3 py-2 text-ink/72">
                      {item.actorName || item.actorUserId || "—"}
                      {item.actorRole ? (
                        <span className="ml-1.5 rounded-full bg-pine/10 px-1.5 py-0.5 text-[10px] font-bold text-pine">
                          {item.actorRole}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-ink">
                      {item.action}
                    </td>
                    <td className="px-3 py-2 text-xs text-ink/72">
                      {item.entityType ? (
                        <>
                          <span className="text-ink/55">{item.entityType}/</span>
                          {item.entityId}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-ink/55">
                      {item.payload ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink/65">
            <p>
              Showing {data.items.length} of {data.totalCount.toLocaleString("en-IN")} entries
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="button-ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="button-ghost"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * data.pageSize >= data.totalCount}
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
