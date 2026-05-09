"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { listOwnerMaintenance, updateMaintenanceStatus } from "@/lib/api/client";
import type { MaintenanceRequestItem, MaintenanceStatus } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const STATUSES: MaintenanceStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"];

const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-ink/10 text-ink/65",
  CANCELLED: "bg-rose-100 text-rose-700"
};

const PRIORITY_TONE: Record<string, string> = {
  LOW: "bg-ink/8 text-ink/55",
  NORMAL: "bg-ink/8 text-ink/55",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-rose-100 text-rose-700"
};

export default function OwnerMaintenancePage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [activeNote, setActiveNote] = useState<{ id: string; note: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-maintenance", accessToken, statusFilter],
    queryFn: () =>
      listOwnerMaintenance(
        { status: statusFilter || undefined, page: 0, pageSize: 50 },
        accessToken ?? undefined
      ),
    enabled: Boolean(accessToken)
  });

  const update = useMutation({
    mutationFn: ({
      requestId,
      status,
      ownerNote
    }: {
      requestId: string;
      status: MaintenanceStatus;
      ownerNote?: string;
    }) =>
      updateMaintenanceStatus(
        requestId,
        { status, ownerNote },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-maintenance"] });
      setActiveNote(null);
    }
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Owner inbox
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Maintenance requests</h1>
          <p className="mt-2 text-sm text-ink/65">
            Tenants raise issues here — keep them moving through the lifecycle.
          </p>
        </div>
        <select
          className="form-control"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </header>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink/60">Loading inbox…</p>
      ) : error ? (
        <p className="mt-8 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load"}
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-16 text-center">
          <Wrench className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">No requests</p>
          <p className="mt-1 text-sm text-ink/55">
            Nothing matching this filter — your tenants are happy 🎉
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {data.items.map((req) => (
            <Row
              key={req.requestId}
              req={req}
              activeNote={activeNote}
              setActiveNote={setActiveNote}
              onUpdate={update.mutate}
              busy={update.isPending}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function Row({
  req,
  activeNote,
  setActiveNote,
  onUpdate,
  busy
}: {
  req: MaintenanceRequestItem;
  activeNote: { id: string; note: string } | null;
  setActiveNote: (n: { id: string; note: string } | null) => void;
  onUpdate: (args: {
    requestId: string;
    status: MaintenanceStatus;
    ownerNote?: string;
  }) => void;
  busy: boolean;
}) {
  const editing = activeNote?.id === req.requestId;
  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_TONE[req.status]}`}>
              {req.status.replace(/_/g, " ")}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_TONE[req.priority]}`}>
              {req.priority}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-copper">
              {req.category.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-ink">{req.title}</h3>
          <p className="mt-1 text-xs text-ink/55">
            {req.listingTitle} · raised by {req.tenantName} · {req.createdAt}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink/72">{req.description}</p>
          {req.ownerNote && !editing ? (
            <p className="mt-3 rounded-xl bg-pine/5 px-3 py-2 text-xs text-ink/72">
              <strong className="text-pine">Your last note:</strong> {req.ownerNote}
            </p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
          <textarea
            className="form-control"
            rows={3}
            placeholder="Note for the tenant (optional)…"
            value={activeNote.note}
            onChange={(event) =>
              setActiveNote({ id: req.requestId, note: event.target.value })
            }
          />
          <div className="flex flex-wrap gap-2">
            {STATUSES.filter((s) => s !== "CANCELLED" || req.status === "CANCELLED").map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy || s === req.status}
                onClick={() =>
                  onUpdate({
                    requestId: req.requestId,
                    status: s,
                    ownerNote: activeNote.note || undefined
                  })
                }
                className={`button-ghost text-xs ${
                  s === req.status ? "opacity-40" : ""
                }`}
              >
                {s === req.status ? "Current" : `Set ${s.replace(/_/g, " ")}`}
              </button>
            ))}
            <button
              type="button"
              className="button-ghost text-xs"
              onClick={() => setActiveNote(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 border-t border-black/5 pt-3">
          <button
            type="button"
            className="button-secondary text-xs"
            onClick={() =>
              setActiveNote({ id: req.requestId, note: req.ownerNote ?? "" })
            }
          >
            Update status / leave note
          </button>
        </div>
      )}
    </article>
  );
}
