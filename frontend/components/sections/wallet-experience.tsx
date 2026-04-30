"use client";

import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Plus,
  X,
  Lock,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowDownCircle
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import {
  getWalletDashboard,
  createWalletTopupCheckout,
  verifyWalletTopup
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { WalletTopupCheckoutResponse } from "@/lib/api/types";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Format an amount that is stored in MAJOR units (rupees / dollars).
 * The DB and API always return amounts in major units — no /100 division needed.
 */
function fmtAmount(amountMajor: number, currency = "INR") {
  const locale =
    currency === "USD" ? "en-US" : currency === "GBP" ? "en-GB" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amountMajor);
}

function fmtDate(val: string | null) {
  if (!val) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(val));
  } catch {
    return val;
  }
}

/* Preset top-up amounts in INR rupees */
const PRESET_AMOUNTS_INR = [500, 1000, 2000, 5000];

/* ─── Stripe card element appearance ─────────────────────────────────────── */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#0F1B2D",
      fontFamily: "Manrope, Inter, sans-serif",
      fontSize: "15px",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "rgba(15,27,45,0.34)" },
      iconColor: "#1565C0"
    },
    invalid: { color: "#DC2626", iconColor: "#DC2626" }
  }
};

/* ─── Stripe payment form ─────────────────────────────────────────────────── */
interface StripeFormProps {
  checkout: WalletTopupCheckoutResponse;
  onSuccess: (paymentIntentId: string) => void;
  onCancel:  () => void;
}

function StripeTopupForm({ checkout, onSuccess, onCancel }: StripeFormProps) {
  const stripe     = useStripe();
  const elements   = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!checkout.clientSecret) {
      setCardError("Payment session expired. Please close and try again.");
      return;
    }

    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError("Card input is unavailable. Please refresh the page.");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      checkout.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name:  checkout.customerName  ?? undefined,
            email: checkout.customerEmail ?? undefined
          }
        }
      }
    );

    if (stripeError) {
      setCardError(stripeError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setCardError("Payment not completed. Status: " + (paymentIntent?.status ?? "unknown"));
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Card details
        </label>
        <div className="stripe-card-element">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/52">
          <Lock className="h-3 w-3" />
          Secured by Stripe — your card details are never stored on our servers
        </p>
        {/* Test-card hint */}
        <div className="mt-3 rounded-lg border border-ink/8 bg-sand/55 px-4 py-3 text-xs leading-6 text-ink/72">
          <p className="font-semibold text-ink">Stripe test card</p>
          <p>
            Use <code>4242 4242 4242 4242</code>, any future expiry (e.g. 12/34),
            CVC <code>123</code>, postcode <code>110001</code>.
          </p>
        </div>
      </div>

      {cardError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {cardError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          className="button-primary flex-1"
          disabled={!stripe || processing}
          type="submit"
        >
          {processing
            ? "Processing…"
            : `Add ${fmtAmount(checkout.amount, checkout.currency)} to wallet`}
        </button>
        <button
          className="button-secondary px-4"
          disabled={processing}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Top-up modal ────────────────────────────────────────────────────────── */
interface TopupModalProps {
  checkout: WalletTopupCheckoutResponse;
  onSuccess: (paymentIntentId: string) => void;
  onClose:   () => void;
}

function TopupModal({ checkout, onSuccess, onClose }: TopupModalProps) {
  const stripePromise = useMemo(
    () =>
      checkout.publishableKey && checkout.publishableKey.length > 10
        ? loadStripe(checkout.publishableKey)
        : null,
    [checkout.publishableKey]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add money to wallet"
    >
      <div
        className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="section-panel relative w-full max-w-md animate-[fade-rise_0.3s_ease_both]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
              Add money · {checkout.providerMode === "STRIPE" ? "Stripe" : "Sandbox"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {checkout.description}
            </h2>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-2 text-ink/46 transition hover:bg-sand hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount summary */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-navy/10 bg-sand px-4 py-3">
          <Wallet className="h-5 w-5 flex-shrink-0 text-navy" />
          <div>
            <p className="text-sm font-semibold text-navy">Wallet top-up</p>
            <p className="text-xs text-ink/60">
              Amount: <strong>{fmtAmount(checkout.amount, checkout.currency)}</strong>
            </p>
          </div>
        </div>

        {/* Payment form */}
        <div className="mt-5">
          {checkout.providerMode === "STRIPE" && stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripeTopupForm
                checkout={checkout}
                onSuccess={onSuccess}
                onCancel={onClose}
              />
            </Elements>
          ) : (
            /* MOCK / sandbox */
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Sandbox mode active</strong> — no real charge will be made.
                Click below to simulate a successful top-up.
              </div>
              <div className="flex gap-3">
                <button
                  className="button-primary flex-1"
                  onClick={() => onSuccess("mock_pi_" + checkout.txnId)}
                  type="button"
                >
                  Simulate ₹ top-up
                </button>
                <button className="button-secondary px-4" onClick={onClose} type="button">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/40">
          <Lock className="h-3 w-3" />
          <span>Powered by Stripe · PCI DSS compliant</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Transaction status badge ────────────────────────────────────────────── */
function TxnBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
        <CheckCircle className="h-3 w-3" /> Completed
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">
      Failed
    </span>
  );
}

/* ─── Main wallet experience ──────────────────────────────────────────────── */
export function WalletExperience() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const accessToken = session?.accessToken;

  const [checkout, setCheckout]           = useState<WalletTopupCheckoutResponse | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customRupees, setCustomRupees]   = useState("");
  const [apiError, setApiError]           = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);

  /* Fetch wallet data */
  const walletQuery = useQuery({
    queryKey: ["wallet-dashboard", accessToken ?? "guest"],
    queryFn:  () => getWalletDashboard(accessToken),
    enabled:  Boolean(accessToken)
  });

  const data       = walletQuery.data;
  const currency   = data?.currency ?? "INR";

  /* Resolved amount in rupees */
  const resolvedAmount = useMemo<number | null>(() => {
    if (selectedPreset !== null) return selectedPreset;
    const parsed = parseFloat(customRupees);
    if (!isNaN(parsed) && parsed >= 1) return Math.floor(parsed);
    return null;
  }, [selectedPreset, customRupees]);

  /* Verify mutation */
  const verifyMutation = useMutation({
    mutationFn: (req: { txnId: string; paymentIntentId: string }) =>
      verifyWalletTopup(req, accessToken),
    onSuccess: (res) => {
      setApiError(null);
      setSuccessMsg(res.message ?? "Wallet topped up successfully!");
      setCheckout(null);
      setSelectedPreset(null);
      setCustomRupees("");
      queryClient.invalidateQueries({
        queryKey: ["wallet-dashboard", accessToken ?? "guest"]
      });
    },
    onError: (err) => {
      setApiError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    }
  });

  /* Checkout mutation */
  const checkoutMutation = useMutation({
    mutationFn: (amountRupees: number) =>
      createWalletTopupCheckout({ amount: amountRupees, currency }, accessToken),
    onSuccess: (res) => {
      setApiError(null);
      setSuccessMsg(null);
      setCheckout(res);
    },
    onError: (err) => {
      setApiError(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
    }
  });

  const handleSuccess = useCallback(
    (paymentIntentId: string) => {
      if (!checkout) return;
      verifyMutation.mutate({ txnId: checkout.txnId, paymentIntentId });
    },
    [checkout, verifyMutation]
  );

  /* ── Unauthenticated ── */
  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Wallet</span>
          <h1 className="mt-5 font-serif text-5xl text-oat">
            Sign in to manage your wallet
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-oat/76">
            Add money to your wallet securely via Stripe and use it for rent, deposits, and booking fees.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/account/login">Sign in</Link>
            <Link
              className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-navy"
              href="/"
            >
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      {/* ── Stripe top-up modal ── */}
      {checkout && (
        <TopupModal
          checkout={checkout}
          onClose={() => setCheckout(null)}
          onSuccess={handleSuccess}
        />
      )}

      <main className="mx-auto max-w-7xl px-6 py-12">

        {/* ── Backend / network error banner ── */}
        {walletQuery.isError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <span className="mt-0.5 flex-shrink-0 font-bold text-red-500">!</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Could not load wallet data</p>
              <p className="mt-0.5 text-xs text-red-600">
                {walletQuery.error instanceof Error
                  ? walletQuery.error.message
                  : "Backend unreachable. Please ensure the backend server is running and try refreshing."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => walletQuery.refetch()}
              className="ml-auto whitespace-nowrap rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Hero banner ── */}
        <section className="hero-panel px-8 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative z-10">
              <span className="eyebrow-pill">Wallet</span>
              <h1 className="mt-6 font-serif text-5xl leading-[1.02] text-oat md:text-6xl">
                Add money and pay with ease.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-oat/76">
                Top up your wallet using Stripe and use your balance for rent, deposits,
                and booking fees — fully secured and tracked.
              </p>
            </div>

            {/* ── Balance card ── */}
            <div className="dark-panel relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/58">
                Current balance
              </p>
              <p className="mt-4 font-serif text-5xl font-bold text-oat">
                {data ? data.balanceFormatted : "—"}
              </p>
              <p className="mt-2 text-sm text-oat/60">
                {data?.currency ?? "INR"} · {data?.providerMode ?? "…"} mode
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Gateway</p>
                  <p className="mt-2 font-serif text-2xl text-oat">
                    {data?.providerMode ?? "…"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Stripe keys</p>
                  <p className="mt-2 font-serif text-2xl text-oat">
                    {data?.stripeConfigured ? "✓ Active" : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">

          {/* ── Add money panel ── */}
          <section className="section-panel">
            <div className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-azure" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                Add money
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              Choose how much to add
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/68">
              Select a preset or enter a custom ₹ amount. Payments are processed securely via Stripe.
            </p>

            {/* ── Preset quick-select ── */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS_INR.map((rupees) => {
                const isActive = selectedPreset === rupees && !customRupees;
                return (
                  <button
                    key={rupees}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(rupees);
                      setCustomRupees("");
                    }}
                    className={[
                      "rounded-2xl border px-5 py-4 text-left transition",
                      isActive
                        ? "border-navy bg-navy/8 ring-2 ring-navy/20"
                        : "border-black/8 bg-white hover:border-navy/30 hover:bg-sand"
                    ].join(" ")}
                  >
                    <p className="font-serif text-2xl font-semibold text-ink">
                      {fmtAmount(rupees, currency)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/52">Quick top-up</p>
                  </button>
                );
              })}
            </div>

            {/* ── Custom amount input ── */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                Or enter a custom amount (₹)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/46">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 3000"
                  value={customRupees}
                  onChange={(e) => {
                    setCustomRupees(e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full rounded-xl border border-black/10 bg-white py-3 pl-8 pr-4 text-sm font-medium text-ink placeholder:text-ink/32 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
              {customRupees && parseFloat(customRupees) < 1 && (
                <p className="mt-1 text-xs text-red-600">Minimum top-up is ₹1.</p>
              )}
            </div>

            {/* ── Inline error banner ── */}
            {apiError && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="mt-0.5 flex-shrink-0 text-red-500">✕</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-700">Something went wrong</p>
                  <p className="mt-0.5 text-xs text-red-600">{apiError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Inline success banner ── */}
            {successMsg && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="ml-auto flex-shrink-0 text-emerald-400 hover:text-emerald-600"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Add money button ── */}
            <button
              type="button"
              disabled={
                resolvedAmount === null ||
                resolvedAmount < 1 ||
                checkoutMutation.isPending ||
                verifyMutation.isPending
              }
              onClick={() => {
                setApiError(null);
                setSuccessMsg(null);
                if (resolvedAmount !== null && resolvedAmount >= 1)
                  checkoutMutation.mutate(resolvedAmount);
              }}
              className="button-primary mt-6 w-full justify-center"
            >
              {checkoutMutation.isPending
                ? "Starting checkout…"
                : resolvedAmount && resolvedAmount >= 1
                ? `Add ${fmtAmount(resolvedAmount, currency)} to wallet`
                : "Select an amount first"}
            </button>

            {/* ── Security note ── */}
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-navy/10 bg-sand px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy" />
              <p className="text-xs leading-5 text-ink/68">
                All transactions are processed by Stripe. Your card details are encrypted
                end-to-end and never stored on our servers.
              </p>
            </div>
          </section>

          {/* ── Transaction history ── */}
          <section className="section-panel">
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="h-5 w-5 text-azure" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                Transaction history
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Recent activity</h2>

            <div className="mt-6 space-y-4">
              {walletQuery.isLoading && (
                <p className="text-sm text-ink/60">Loading transactions…</p>
              )}

              {!walletQuery.isLoading &&
                (!data?.transactions || data.transactions.length === 0) && (
                  <div className="rounded-2xl border border-dashed border-black/12 bg-sand/40 px-6 py-10 text-center">
                    <Wallet className="mx-auto h-8 w-8 text-ink/28" />
                    <p className="mt-3 text-sm font-medium text-ink/52">
                      No transactions yet
                    </p>
                    <p className="mt-1 text-xs text-ink/40">
                      Add money to your wallet to see activity here.
                    </p>
                  </div>
                )}

              {data?.transactions?.map((txn) => (
                <div
                  key={txn.txnId}
                  className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {txn.description}
                      </p>
                      <p className="mt-1 text-xs text-ink/58">{fmtDate(txn.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="whitespace-nowrap text-sm font-bold text-navy">
                        + {fmtAmount(txn.amount, txn.currency)}
                      </p>
                      <TxnBadge status={txn.status} />
                    </div>
                  </div>
                  {txn.completedAt && txn.status === "COMPLETED" && (
                    <p className="mt-2 text-xs text-ink/46">
                      Credited: {fmtDate(txn.completedAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── How it works ── */}
        <section className="mt-8 section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
            How it works
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Choose ₹ amount",
                body: "Pick a preset (₹500 / ₹1,000 / ₹2,000 / ₹5,000) or enter any custom rupee amount."
              },
              {
                step: "2",
                title: "Pay via Stripe",
                body: "Enter your card details in the secure Stripe checkout overlay. Use test card 4242 4242 4242 4242."
              },
              {
                step: "3",
                title: "Balance credited instantly",
                body: "Once the payment succeeds, your wallet balance is updated immediately in rupees."
              }
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-2xl border border-black/8 bg-white px-6 py-5 shadow-soft"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-oat">
                  {step}
                </div>
                <p className="mt-4 font-semibold text-ink">{title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/68">{body}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
