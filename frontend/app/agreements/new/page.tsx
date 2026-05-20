"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSignature, Loader2 } from "lucide-react";
import { useState } from "react";
import { createRentalAgreement } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Owner-only — draft a new rental agreement.
 *
 * The owner picks a property (from their listings), enters tenant id,
 * dates, rent + deposit, optional terms. Submit creates a DRAFT.
 * Owner then clicks "Send for signatures" on the detail page to move
 * the agreement to AWAITING_SIGNATURES.
 */
export default function NewAgreementPage() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useAuthStore((s) => s.session);
  const accessToken = session?.accessToken;

  const [propertyId, setPropertyId] = useState(params.get("propertyId") ?? "");
  const [tenantId, setTenantId] = useState(params.get("tenantId") ?? "");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [leaseEndDate, setLeaseEndDate] = useState("");
  const [noticeDays, setNoticeDays] = useState("60");
  const [additionalTerms, setAdditionalTerms] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createRentalAgreement(
        {
          propertyId,
          tenantId,
          monthlyRentPaise: Math.round(parseFloat(monthlyRent) * 100),
          depositPaise: Math.round(parseFloat(deposit) * 100),
          leaseStartDate,
          leaseEndDate,
          noticePeriodDays: parseInt(noticeDays, 10) || 60,
          additionalTerms: additionalTerms || undefined
        },
        accessToken
      ),
    onSuccess: (created) => {
      router.push(`/agreements/${created.agreementId}`);
    }
  });

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/65">Sign in as an owner to draft a rental agreement.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
        <FileSignature className="mr-1 inline h-3.5 w-3.5" />
        New rental agreement
      </p>
      <h1 className="mt-1 font-serif text-3xl text-ink">Draft an agreement</h1>
      <p className="mt-1 text-sm text-ink/60">
        Fill in the terms — both parties sign on the detail page after you "Send for signatures".
      </p>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <label className="field-label">
          Listing ID
          <input
            className="form-control mt-2"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="e.g. listing_abc123"
            required
          />
        </label>
        <label className="field-label">
          Tenant user ID
          <input
            className="form-control mt-2"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="e.g. user_xxx"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Monthly rent (₹)
            <input
              className="form-control mt-2"
              type="number"
              min="1"
              step="1"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Deposit (₹)
            <input
              className="form-control mt-2"
              type="number"
              min="0"
              step="1"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Lease start date
            <input
              className="form-control mt-2"
              type="date"
              value={leaseStartDate}
              onChange={(e) => setLeaseStartDate(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Lease end date
            <input
              className="form-control mt-2"
              type="date"
              value={leaseEndDate}
              onChange={(e) => setLeaseEndDate(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="field-label">
          Notice period (days)
          <input
            className="form-control mt-2"
            type="number"
            min="0"
            max="180"
            value={noticeDays}
            onChange={(e) => setNoticeDays(e.target.value)}
          />
        </label>

        <label className="field-label">
          Additional terms (optional)
          <textarea
            className="form-control mt-2"
            rows={4}
            maxLength={4000}
            value={additionalTerms}
            onChange={(e) => setAdditionalTerms(e.target.value)}
            placeholder="Pet policy, parking allocation, society rules, etc."
          />
        </label>

        {create.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {create.error instanceof Error ? create.error.message : "Could not create agreement."}
          </p>
        ) : null}

        <button type="submit" className="button-primary justify-self-start" disabled={create.isPending}>
          {create.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create draft"
          )}
        </button>
      </form>
    </main>
  );
}
