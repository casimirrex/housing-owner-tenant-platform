"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { useState } from "react";
import { listMyRentalAgreements } from "@/lib/api/client";
import type { RentalAgreementStatus } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const STATUS_LABEL: Record<RentalAgreementStatus, string> = {
  DRAFT: "Draft",
  AWAITING_SIGNATURES: "Awaiting signatures",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  TERMINATED: "Terminated"
};

const STATUS_TINT: Record<RentalAgreementStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  AWAITING_SIGNATURES: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-200 text-slate-700",
  TERMINATED: "bg-rose-100 text-rose-700"
};

export default function MyAgreementsPage() {
  const session = useAuthStore((s) => s.session);
  const accessToken = session?.accessToken;
  const [role, setRole] = useState<"TENANT" | "OWNER">(
    (session?.role === "OWNER" ? "OWNER" : "TENANT") as "TENANT" | "OWNER"
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-rental-agreements", role, accessToken ?? "anon"],
    queryFn: () => listMyRentalAgreements(role, accessToken),
    enabled: Boolean(accessToken)
  });

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/65">Sign in to see your rental agreements.</p>
        <Link className="button-primary mt-4 inline-block" href="/account/login">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
            <FileSignature className="mr-1 inline h-3.5 w-3.5" />
            Rental Agreements
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">My agreements</h1>
          <p className="mt-1 text-sm text-ink/60">
            Digital leases — track, sign, and download as PDF.
          </p>
        </div>
        {session?.role === "OWNER" ? (
          <Link href="/agreements/new" className="button-primary">
            <Plus className="mr-2 h-4 w-4" />
            New agreement
          </Link>
        ) : null}
      </header>

      {/* Role toggle — shown only when the user has both roles */}
      <div className="mt-6 inline-flex rounded-full border border-black/10 bg-white p-1">
        {(["TENANT", "OWNER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              role === r ? "bg-pine text-white" : "text-ink/65 hover:text-ink"
            }`}
          >
            {r === "TENANT" ? "As tenant" : "As owner"}
          </button>
        ))}
      </div>

      <section className="mt-6">
        {isLoading ? (
          <p className="text-sm text-ink/56">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-rose-700">
            {error instanceof Error ? error.message : "Could not load agreements."}
          </p>
        ) : !data || data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/12 bg-white/70 px-6 py-10 text-center text-sm text-ink/56">
            No rental agreements yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.map((a) => (
              <li
                key={a.agreementId}
                className="rounded-2xl border border-black/8 bg-white p-4 shadow-soft transition hover:border-pine/40"
              >
                <Link
                  href={`/agreements/${a.agreementId}`}
                  className="flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{a.propertyTitle}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {a.counterpartyRole === "TENANT" ? "Tenant" : "Owner"}:{" "}
                      <span className="text-ink">{a.counterpartyName}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink/52">
                      {new Date(a.leaseStartDate).toLocaleDateString("en-IN")} →{" "}
                      {new Date(a.leaseEndDate).toLocaleDateString("en-IN")} · ₹
                      {(a.monthlyRentPaise / 100).toLocaleString("en-IN")}/mo
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TINT[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
