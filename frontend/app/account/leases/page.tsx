"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  ExternalLink,
  FileText,
  IndianRupee,
  Plus,
  X
} from "lucide-react";
import { useState } from "react";
import {
  createLease,
  listMyLeases,
  updateLeaseStatus
} from "@/lib/api/client";
import type { LeaseItem, LeaseStatus } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";
import { WhatsAppShareButton } from "@/components/ui/whatsapp-button";
import { shareLeaseMessage } from "@/lib/whatsapp";

export default function TenantLeasesPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [listingId, setListingId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-leases", accessToken],
    queryFn: () => listMyLeases(accessToken ?? undefined),
    enabled: Boolean(accessToken)
  });

  const create = useMutation({
    mutationFn: () =>
      createLease(
        {
          listingId,
          startDate,
          endDate,
          monthlyRent: Number(monthlyRent || 0),
          securityDeposit: Number(deposit || 0),
          documentUrl: documentUrl || undefined,
          notes: notes || undefined
        },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leases"] });
      setOpenModal(false);
      setListingId("");
      setStartDate("");
      setEndDate("");
      setMonthlyRent("");
      setDeposit("");
      setDocumentUrl("");
      setNotes("");
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeaseStatus }) =>
      updateLeaseStatus(id, status, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leases"] });
    }
  });

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/60">Sign in to view your lease records.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Lease tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">My leases</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/65">
            Record your active rent agreement so we can remind you before it expires. Documents
            are stored as a URL — paste a Drive / Dropbox link or upload via the listing photos
            endpoint.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {data && data.expiringSoonCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              <AlertCircle className="h-3.5 w-3.5" />
              {data.expiringSoonCount} expiring within 60 days
            </span>
          ) : null}
          <button className="button-primary" onClick={() => setOpenModal(true)} type="button">
            <Plus className="mr-2 h-4 w-4" /> Record lease
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink/60">Loading…</p>
      ) : error ? (
        <p className="mt-8 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load leases"}
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">No leases recorded yet</p>
          <p className="mt-1 text-sm text-ink/55">
            Click &ldquo;Record lease&rdquo; once you sign your rent agreement.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {data.items.map((lease) => (
            <LeaseCard
              key={lease.leaseId}
              lease={lease}
              onUpdate={(status) =>
                updateStatus.mutate({ id: lease.leaseId, status })
              }
              busy={updateStatus.isPending}
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
                  New lease
                </p>
                <h3 className="mt-1 text-xl font-semibold text-ink">Record your agreement</h3>
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
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                Start date
                <input
                  type="date"
                  className="form-control mt-2"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="field-label">
                End date
                <input
                  type="date"
                  className="form-control mt-2"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
              <label className="field-label">
                Monthly rent (₹)
                <input
                  type="number"
                  className="form-control mt-2"
                  placeholder="32000"
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                />
              </label>
              <label className="field-label">
                Security deposit (₹)
                <input
                  type="number"
                  className="form-control mt-2"
                  placeholder="64000"
                  value={deposit}
                  onChange={(event) => setDeposit(event.target.value)}
                />
              </label>
            </div>
            <label className="field-label mt-4 block">
              Document URL <span className="text-ink/40">(optional)</span>
              <input
                className="form-control mt-2"
                placeholder="https://drive.google.com/…"
                value={documentUrl}
                onChange={(event) => setDocumentUrl(event.target.value)}
              />
            </label>
            <label className="field-label mt-4 block">
              Notes <span className="text-ink/40">(optional)</span>
              <textarea
                className="form-control mt-2"
                rows={2}
                maxLength={2000}
                placeholder="Lock-in 11 months, notice period 60 days…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            {create.error ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {create.error instanceof Error ? create.error.message : "Could not save"}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-ghost"
                onClick={() => setOpenModal(false)}
                disabled={create.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => create.mutate()}
                disabled={
                  create.isPending ||
                  !listingId.trim() ||
                  !startDate ||
                  !endDate ||
                  !monthlyRent ||
                  Number(monthlyRent) < 1
                }
              >
                {create.isPending ? "Saving…" : "Save lease"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function LeaseCard({
  lease,
  onUpdate,
  busy
}: {
  lease: LeaseItem;
  onUpdate: (status: LeaseStatus) => void;
  busy: boolean;
}) {
  const expiringSoon =
    lease.status === "ACTIVE" && lease.daysUntilEnd >= 0 && lease.daysUntilEnd <= 60;
  const expired = lease.status === "ACTIVE" && lease.daysUntilEnd < 0;

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-soft ${
        expired
          ? "border-rose-200"
          : expiringSoon
            ? "border-amber-200"
            : "border-black/8"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{lease.listingTitle}</h3>
          <p className="mt-1 text-xs text-ink/55">
            Owner: {lease.ownerName} · listing {lease.listingId}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink/72">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {lease.startDate} → {lease.endDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              ₹{lease.monthlyRent.toLocaleString("en-IN")}/mo
            </span>
            {lease.securityDeposit > 0 ? (
              <span>Deposit ₹{lease.securityDeposit.toLocaleString("en-IN")}</span>
            ) : null}
            {lease.documentUrl ? (
              <a
                href={lease.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-pine hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Document
              </a>
            ) : null}
          </div>
          {lease.notes ? (
            <p className="mt-2 text-sm leading-5 text-ink/68">{lease.notes}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            lease.status === "ACTIVE"
              ? expired
                ? "bg-rose-100 text-rose-700"
                : expiringSoon
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-700"
              : lease.status === "ENDED"
                ? "bg-ink/10 text-ink/65"
                : "bg-rose-100 text-rose-700"
          }`}
        >
          {expired && lease.status === "ACTIVE"
            ? "EXPIRED"
            : expiringSoon
              ? `${lease.daysUntilEnd}d left`
              : lease.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-3">
        <WhatsAppShareButton
          size="sm"
          label="Share lease"
          message={shareLeaseMessage({
            listingTitle: lease.listingTitle,
            rent: lease.monthlyRent,
            startDate: lease.startDate,
            endDate: lease.endDate
          })}
        />
        {lease.status === "ACTIVE" ? (
          <>
            <button
              type="button"
              onClick={() => onUpdate("ENDED")}
              disabled={busy}
              className="button-ghost text-xs"
            >
              Mark as ended
            </button>
            <button
              type="button"
              onClick={() => onUpdate("TERMINATED")}
              disabled={busy}
              className="button-ghost text-xs text-rose-700"
            >
              Terminated early
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
