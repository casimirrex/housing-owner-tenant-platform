"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { getOwnerVerification, purchaseOwnerVerification } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Tier 1 #2 — Verified Owner Badge.
 * One-click pay Rs 199 from wallet → permanent badge on every listing.
 * Embedded in owner dashboard.
 */
export function OwnerVerificationPanel() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const verificationQuery = useQuery({
    queryKey: ["owner-verification", accessToken ?? "guest"],
    queryFn: () => getOwnerVerification(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000
  });

  const verifyMutation = useMutation({
    mutationFn: () => purchaseOwnerVerification(accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-verification", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-dashboard", accessToken ?? "guest"] });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not complete verification.");
    }
  });

  if (verificationQuery.isLoading || !verificationQuery.data) {
    return null; // graceful: don't show until we know status
  }
  const data = verificationQuery.data;

  if (data.verified) {
    return (
      <section className="section-panel mt-8">
        <div className="flex items-center gap-3">
          <BadgeCheck className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Verified Owner
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              You are verified — the badge appears on all your listings
            </h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-panel mt-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-copper" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Verified Owner Badge
        </p>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-ink">Become a Verified Owner</h2>
      <p className="mt-2 text-sm leading-6 text-ink/68">
        Pay <strong>Rs 199</strong> once to add a permanent ✓ Verified Owner badge to every
        listing you publish. Tenants trust verified owners more — expect higher quality leads.
      </p>

      <ul className="mt-4 space-y-2 rounded-xl bg-sand/50 p-4">
        <li className="flex gap-2 text-sm text-ink/72">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
          <span>Trust pill on every listing&apos;s detail page</span>
        </li>
        <li className="flex gap-2 text-sm text-ink/72">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
          <span>One-time payment — no renewal hassle</span>
        </li>
        <li className="flex gap-2 text-sm text-ink/72">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
          <span>Paid from your existing wallet</span>
        </li>
      </ul>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <button
          type="button"
          className="button-primary"
          disabled={verifyMutation.isPending}
          onClick={() => verifyMutation.mutate()}
        >
          {verifyMutation.isPending ? "Processing…" : "Pay Rs 199 from wallet"}
        </button>
        <span className="ml-3 text-xs text-ink/52">
          Wallet balance: Rs {data.walletBalance.toLocaleString("en-IN")}
        </span>
      </div>
    </section>
  );
}
