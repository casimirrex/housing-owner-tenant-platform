"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileSignature, Printer, CheckCircle, XCircle, Send, Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
  acceptRentalAgreement,
  getRentalAgreement,
  sendRentalAgreement,
  terminateRentalAgreement
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  DRAFT: { bg: "bg-slate-100", text: "text-slate-700", label: "Draft" },
  AWAITING_SIGNATURES: { bg: "bg-amber-100", text: "text-amber-800", label: "Awaiting signatures" },
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
  EXPIRED: { bg: "bg-slate-200", text: "text-slate-700", label: "Expired" },
  TERMINATED: { bg: "bg-rose-100", text: "text-rose-700", label: "Terminated" }
};

function inr(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function RentalAgreementExperience({ agreementId }: { agreementId: string }) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["rental-agreement", agreementId, accessToken ?? "anon"],
    queryFn: () => getRentalAgreement(agreementId, accessToken),
    enabled: Boolean(accessToken)
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["rental-agreement", agreementId] });

  const sendMutation = useMutation({
    mutationFn: () => sendRentalAgreement(agreementId, accessToken),
    onSuccess: invalidate
  });
  const acceptMutation = useMutation({
    mutationFn: () => acceptRentalAgreement(agreementId, accessToken),
    onSuccess: invalidate
  });
  const terminateMutation = useMutation({
    mutationFn: () => terminateRentalAgreement(agreementId, accessToken),
    onSuccess: invalidate
  });

  const isOwner = useMemo(
    () => Boolean(session && data && session.userId === data.ownerId),
    [session, data]
  );
  const isTenant = useMemo(
    () => Boolean(session && data && session.userId === data.tenantId),
    [session, data]
  );

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/65">Please sign in to view this rental agreement.</p>
        <Link className="button-primary mt-4 inline-block" href="/account/login">
          Sign in
        </Link>
      </main>
    );
  }
  if (isLoading) {
    return (
      <main className="mx-auto flex max-w-2xl items-center justify-center px-6 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-ink/40" />
      </main>
    );
  }
  if (isError || !data) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load agreement."}
        </p>
        <Link className="button-secondary mt-4 inline-block" href="/agreements">
          Back to agreements
        </Link>
      </main>
    );
  }

  const style = STATUS_STYLES[data.status] ?? STATUS_STYLES.DRAFT;
  const canSend = isOwner && data.status === "DRAFT";
  const canAccept =
    data.status === "AWAITING_SIGNATURES" &&
    ((isOwner && !data.ownerAcceptedAt) || (isTenant && !data.tenantAcceptedAt));
  const canTerminate = data.status === "ACTIVE";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
            <FileSignature className="mr-1 inline h-3.5 w-3.5" />
            Rental Agreement
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">{data.propertyTitle}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {data.propertyLocality}, {data.propertyCity}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${style.text} px-3 py-1 text-xs font-semibold`}
        >
          {style.label}
        </span>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <KeyValue label="Monthly rent" value={inr(data.monthlyRentPaise)} />
        <KeyValue label="Deposit" value={inr(data.depositPaise)} />
        <KeyValue label="Notice period" value={`${data.noticePeriodDays} days`} />
        <KeyValue label="Lease start" value={new Date(data.leaseStartDate).toLocaleDateString("en-IN")} />
        <KeyValue label="Lease end" value={new Date(data.leaseEndDate).toLocaleDateString("en-IN")} />
        <KeyValue label="Owner" value={data.ownerName} />
        <KeyValue label="Tenant" value={data.tenantName} />
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        {canSend ? (
          <button
            type="button"
            className="button-primary"
            disabled={sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? "Sending…" : "Send for signatures"}
          </button>
        ) : null}
        {canAccept ? (
          <button
            type="button"
            className="button-primary"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {acceptMutation.isPending ? "Signing…" : "I agree — sign now"}
          </button>
        ) : null}
        {canTerminate ? (
          <button
            type="button"
            className="button-secondary"
            disabled={terminateMutation.isPending}
            onClick={() => {
              if (window.confirm("Terminate this lease early? This cannot be undone.")) {
                terminateMutation.mutate();
              }
            }}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Terminate lease
          </button>
        ) : null}
        <button
          type="button"
          className="button-ghost"
          onClick={() => window.print()}
          title="Use your browser's print dialog to save as PDF"
        >
          <Printer className="mr-2 h-4 w-4" />
          Download PDF (Print)
        </button>
      </section>

      {/* Status / signature progress */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/8 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">Owner</p>
          <p className="mt-1 text-sm font-medium text-ink">{data.ownerName}</p>
          <p className="mt-1 text-xs text-ink/60">
            {data.ownerAcceptedAt
              ? `Signed ${new Date(data.ownerAcceptedAt).toLocaleString("en-IN")}`
              : "Pending signature"}
          </p>
        </div>
        <div className="rounded-xl border border-black/8 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">Tenant</p>
          <p className="mt-1 text-sm font-medium text-ink">{data.tenantName}</p>
          <p className="mt-1 text-xs text-ink/60">
            {data.tenantAcceptedAt
              ? `Signed ${new Date(data.tenantAcceptedAt).toLocaleString("en-IN")}`
              : "Pending signature"}
          </p>
        </div>
      </section>

      {/* Rendered agreement body — also used by browser's print dialog */}
      <section className="mt-8 rounded-2xl border border-black/8 bg-white p-6 shadow-soft">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.htmlBody }}
        />
      </section>
    </main>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/8 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/52">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
