"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Wrench,
  X,
  XCircle
} from "lucide-react";
import { useState } from "react";
import {
  cancelMaintenanceRequest,
  createMaintenanceRequest,
  listTenantMaintenance
} from "@/lib/api/client";
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceRequestItem
} from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: "PLUMBING", label: "🚰 Plumbing" },
  { value: "ELECTRICAL", label: "⚡ Electrical" },
  { value: "APPLIANCE", label: "🔌 Appliance" },
  { value: "PAINTING", label: "🎨 Painting" },
  { value: "PEST_CONTROL", label: "🐜 Pest control" },
  { value: "CLEANING", label: "🧹 Cleaning" },
  { value: "CARPENTRY", label: "🔨 Carpentry" },
  { value: "OTHER", label: "❓ Other" }
];

const PRIORITIES: MaintenancePriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-ink/10 text-ink/65",
  CANCELLED: "bg-rose-100 text-rose-700"
};

const STATUS_ICON: Record<string, any> = {
  OPEN: Clock,
  IN_PROGRESS: Wrench,
  RESOLVED: CheckCircle2,
  CLOSED: CheckCircle2,
  CANCELLED: XCircle
};

export default function TenantMaintenancePage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [listingId, setListingId] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("PLUMBING");
  const [priority, setPriority] = useState<MaintenancePriority>("NORMAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant-maintenance", accessToken, statusFilter],
    queryFn: () =>
      listTenantMaintenance(
        { status: statusFilter || undefined, page: 0, pageSize: 50 },
        accessToken ?? undefined
      ),
    enabled: Boolean(accessToken)
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createMaintenanceRequest(
        { listingId, category, priority, title, description },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-maintenance"] });
      setOpenModal(false);
      setListingId("");
      setTitle("");
      setDescription("");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) =>
      cancelMaintenanceRequest(requestId, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-maintenance"] });
    }
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Maintenance
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">My maintenance requests</h1>
          <p className="mt-2 text-sm text-ink/65">
            Raise a ticket for any issue at your home — your owner will see it in their inbox.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="form-control"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button className="button-primary" onClick={() => setOpenModal(true)} type="button">
            <Plus className="mr-2 h-4 w-4" /> Raise request
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink/60">Loading…</p>
      ) : error ? (
        <p className="mt-8 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load requests"}
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-16 text-center">
          <Wrench className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">No requests yet</p>
          <p className="mt-1 text-sm text-ink/55">
            Click &ldquo;Raise request&rdquo; above to flag an issue.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {data.items.map((req) => (
            <RequestCard
              key={req.requestId}
              req={req}
              onCancel={() => cancelMutation.mutate(req.requestId)}
              cancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      {openModal ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  New request
                </p>
                <h3 className="mt-1 text-xl font-semibold text-ink">
                  Tell your owner what&apos;s wrong
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="field-label mt-5 block">
              Listing id
              <input
                className="form-control mt-2"
                placeholder="listing_001"
                value={listingId}
                onChange={(event) => setListingId(event.target.value)}
              />
              <span className="mt-1 text-xs text-ink/50">
                Find this in the URL of the property page
              </span>
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                Category
                <select
                  className="form-control mt-2"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as MaintenanceCategory)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Priority
                <select
                  className="form-control mt-2"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as MaintenancePriority)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field-label mt-4 block">
              Title
              <input
                className="form-control mt-2"
                placeholder="Kitchen tap is leaking…"
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="field-label mt-4 block">
              Describe the issue
              <textarea
                className="form-control mt-2"
                rows={4}
                placeholder="Started 2 days ago, water pooling under the sink…"
                maxLength={4000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            {createMutation.error ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Could not submit"}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-ghost"
                onClick={() => setOpenModal(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => createMutation.mutate()}
                disabled={
                  createMutation.isPending ||
                  !listingId.trim() ||
                  title.trim().length < 4 ||
                  description.trim().length < 10
                }
              >
                {createMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function RequestCard({
  req,
  onCancel,
  cancelling
}: {
  req: MaintenanceRequestItem;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const Icon = STATUS_ICON[req.status] ?? AlertTriangle;
  const tone = STATUS_TONE[req.status] ?? "bg-ink/10 text-ink/65";
  const canCancel = req.status === "OPEN" || req.status === "IN_PROGRESS";

  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tone}`}>
              <Icon className="h-3 w-3" />
              {req.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-copper">
              {req.category.replace(/_/g, " ")}
            </span>
            {req.priority !== "NORMAL" ? (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                req.priority === "URGENT"
                  ? "bg-rose-100 text-rose-700"
                  : req.priority === "HIGH"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-ink/8 text-ink/55"
              }`}>
                {req.priority}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold text-ink">{req.title}</h3>
          <p className="mt-1 text-xs text-ink/55">
            {req.listingTitle} · raised {req.createdAt}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink/72">{req.description}</p>
          {req.ownerNote ? (
            <p className="mt-3 rounded-xl bg-pine/5 px-3 py-2 text-xs text-ink/72">
              <strong className="text-pine">Owner note:</strong> {req.ownerNote}
            </p>
          ) : null}
        </div>
        {canCancel ? (
          <button
            type="button"
            className="button-ghost text-xs"
            onClick={onCancel}
            disabled={cancelling}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}
