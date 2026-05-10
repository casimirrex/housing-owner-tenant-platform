"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  cancelDeletion,
  getDeletionStatus,
  requestAccountDeletion
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Phase 1 — DPDP / GDPR-compliant privacy page.
 *
 * Two controls:
 *   1. Request account deletion (30-day grace) + cancel
 *   2. Download all my data as JSON (single-click)
 */
export default function AccountPrivacyPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const status = useQuery({
    queryKey: ["account-deletion-status", accessToken],
    queryFn: () => getDeletionStatus(accessToken ?? undefined),
    enabled: Boolean(accessToken)
  });

  const requestMutation = useMutation({
    mutationFn: () => requestAccountDeletion(reason || undefined, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-deletion-status"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDeletion(accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-deletion-status"] });
    }
  });

  const downloadJson = async () => {
    if (!accessToken) return;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${apiBase}/api/v1/account/data-export`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      alert("Could not download — please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-testition-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/60">Sign in to manage your privacy settings.</p>
      </main>
    );
  }

  const currentStatus = status.data?.status as string | undefined;
  const completesAt = status.data?.completesAt as string | undefined;
  const isPending = currentStatus === "PENDING";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          <ShieldCheck className="mr-1.5 inline h-4 w-4" />
          Privacy &amp; data
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Your privacy controls</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          You can download a copy of every record we hold on you, or schedule your account
          for permanent deletion. Required by India&apos;s DPDP Act and the GDPR.
        </p>
      </header>

      {/* Data export */}
      <section className="mt-8 rounded-2xl border border-black/8 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine/10 text-pine">
            <Download className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-ink">Download my data</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">
              A single JSON file containing your profile, listings, leases, visits, chat
              threads, leads, wallet history, and maintenance requests.
            </p>
            <button
              type="button"
              onClick={downloadJson}
              className="button-secondary mt-4"
            >
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </button>
          </div>
        </div>
      </section>

      {/* Account deletion */}
      <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-ink">Delete my account</h2>
            <p className="mt-1 text-sm leading-6 text-ink/72">
              Schedules permanent deletion 30 days from now. During the grace window you can
              cancel and keep your account. After deletion, your listings, chat history,
              reviews, and saved data are removed from our systems.
            </p>

            {isPending ? (
              <div className="mt-4 rounded-xl bg-white p-4 shadow-soft">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Deletion scheduled
                    </p>
                    <p className="mt-1 text-xs text-ink/65">
                      Your account will be permanently deleted on{" "}
                      <strong>{completesAt}</strong>. Cancel any time before then to keep
                      your account.
                    </p>
                    <button
                      type="button"
                      className="button-secondary mt-3 text-xs"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending
                        ? "Cancelling…"
                        : "Cancel deletion request"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <label className="field-label mt-4 block">
                  Reason <span className="text-ink/40">(optional)</span>
                  <textarea
                    className="form-control mt-2"
                    rows={3}
                    maxLength={500}
                    placeholder="What made you decide to leave? (helps us improve)"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>

                {requestMutation.error ? (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {requestMutation.error instanceof Error
                      ? requestMutation.error.message
                      : "Could not submit request."}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Schedule deletion in 30 days? You can cancel any time before then."
                      )
                    ) {
                      requestMutation.mutate();
                    }
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  disabled={requestMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {requestMutation.isPending
                    ? "Scheduling…"
                    : "Schedule account deletion"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
