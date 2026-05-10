"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, RotateCcw } from "lucide-react";
import { useState } from "react";
import { adminIssueRefund, adminListRefunds } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export default function AdminRefundsPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  const refunds = useQuery({
    queryKey: ["admin-refunds", accessToken],
    queryFn: () => adminListRefunds(50, accessToken ?? undefined),
    enabled: Boolean(accessToken)
  });

  const issue = useMutation({
    mutationFn: () =>
      adminIssueRefund(
        {
          userId: userId.trim(),
          amountRupees: Number(amountRupees),
          reason: reason.trim(),
          referencePayment: reference.trim() || undefined
        },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      setUserId("");
      setAmountRupees("");
      setReason("");
      setReference("");
    }
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Refunds
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Issue wallet refund</h2>
          <p className="mt-2 max-w-xl text-sm text-ink/65">
            Credits the user&apos;s wallet directly. Use the user id from the Users page (e.g.
            <code className="mx-1 rounded bg-ink/8 px-1 py-0.5 text-[11px]">user_42</code>).
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form
          className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            issue.mutate();
          }}
        >
          <label className="field-label">
            User id
            <input
              className="form-control mt-2"
              placeholder="user_42"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </label>
          <label className="field-label mt-3 block">
            Amount (₹)
            <input
              type="number"
              className="form-control mt-2"
              placeholder="499"
              value={amountRupees}
              onChange={(event) => setAmountRupees(event.target.value)}
              min={1}
            />
          </label>
          <label className="field-label mt-3 block">
            Reason
            <input
              className="form-control mt-2"
              placeholder="Lead fee refunded — visit cancelled"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={4}
              maxLength={500}
            />
          </label>
          <label className="field-label mt-3 block">
            Reference payment <span className="text-ink/40">(optional)</span>
            <input
              className="form-control mt-2"
              placeholder="lead_a1b2c3"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              maxLength={200}
            />
          </label>

          {issue.error ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {issue.error instanceof Error
                ? issue.error.message
                : "Could not issue refund."}
            </p>
          ) : null}

          {issue.isSuccess && issue.data ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Refund issued — new wallet balance: ₹
              {issue.data.newWalletBalanceRupees.toLocaleString("en-IN")}
            </p>
          ) : null}

          <button
            type="submit"
            className="button-primary mt-5"
            disabled={
              issue.isPending ||
              !userId.trim() ||
              !amountRupees ||
              Number(amountRupees) < 1 ||
              reason.trim().length < 4
            }
          >
            <IndianRupee className="mr-2 h-4 w-4" />
            {issue.isPending ? "Issuing…" : "Issue refund"}
          </button>
        </form>

        {/* Recent refunds */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
            Recent refunds
          </p>
          {refunds.isLoading ? (
            <p className="mt-3 text-sm text-ink/60">Loading…</p>
          ) : !refunds.data || refunds.data.length === 0 ? (
            <p className="mt-3 text-sm text-ink/55">No refunds yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-black/8 bg-white shadow-soft">
              <table className="min-w-full text-sm">
                <thead className="bg-canvas/60 text-xs uppercase tracking-wider text-ink/55">
                  <tr>
                    <th className="px-3 py-2 text-left">When</th>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.data.map((row) => {
                    const r = row as Record<string, unknown>;
                    return (
                      <tr
                        key={r.refundId as string}
                        className="border-t border-black/5"
                      >
                        <td className="px-3 py-2 text-xs text-ink/55">
                          {r.createdAt as string}
                        </td>
                        <td className="px-3 py-2 text-ink/72">
                          {(r.userName as string) || (r.userId as string)}
                        </td>
                        <td className="px-3 py-2 font-semibold text-ink">
                          ₹{(r.amountRupees as number).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-ink/72">{r.reason as string}</td>
                        <td className="px-3 py-2 text-xs text-ink/55">
                          {(r.adminName as string) || (r.initiatedByAdmin as string)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
