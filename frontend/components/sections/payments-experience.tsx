"use client";

import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeIndianRupee, CreditCard, Wallet, ShieldCheck, X, Lock, CheckCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import {
  createPaymentCheckout,
  getPaymentsDashboard,
  verifyPayment
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { PaymentCheckoutResponse } from "@/lib/api/types";

/* ─── Razorpay global type (kept for backward compatibility) ─────────────── */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
/**
 * Format a value stored in MAJOR currency units (rupees / dollars).
 * No /100 division — the DB stores amounts as whole rupees.
 */
function formatCurrency(value: number, currency = "INR") {
  const locale = currency === "USD" ? "en-US" : currency === "GBP" ? "en-GB" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

async function loadRazorpayScript(scriptUrl: string) {
  if (typeof window === "undefined" || window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Checkout script failed.")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = scriptUrl;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Checkout script failed."));
    document.body.appendChild(s);
  });
}

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

/* ─── Stripe payment form (rendered inside <Elements>) ───────────────────── */
interface StripeFormProps {
  checkout: PaymentCheckoutResponse;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function StripePaymentForm({ checkout, onSuccess, onCancel }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!checkout.clientSecret) {
      setError("Payment session missing. Please close and try again.");
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card input is not available. Please refresh the page.");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      checkout.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: checkout.customerName ?? undefined,
            email: checkout.customerEmail ?? undefined
          }
        }
      }
    );

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("Payment was not completed. Status: " + paymentIntent?.status);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="field-label mb-2 block">Card details</label>
        <div className="stripe-card-element">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/52">
          <Lock className="h-3 w-3" />
          Secured by Stripe — your card details are never stored on our servers
        </p>
        <div className="mt-3 rounded-lg border border-ink/8 bg-sand/55 px-4 py-3 text-xs leading-6 text-ink/72">
          <p className="font-semibold text-ink">Stripe test card</p>
          <p>
            Card: <code>4242 4242 4242 4242</code> · Expiry: any future date ·
            CVC: <code>123</code> · Postcode: <code>110001</code>
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          className="button-primary flex-1"
          disabled={!stripe || processing}
          type="submit"
        >
          {processing ? "Processing…" : `Pay ${formatCurrency(checkout.amount, checkout.currency)}`}
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

/* ─── Stripe checkout modal ──────────────────────────────────────────────── */
interface StripeModalProps {
  checkout: PaymentCheckoutResponse;
  onSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

function StripeCheckoutModal({ checkout, onSuccess, onClose }: StripeModalProps) {
  const stripePromise = useMemo(() => loadStripe(checkout.keyId ?? ""), [checkout.keyId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="section-panel relative w-full max-w-md animate-[fade-rise_0.3s_ease_both]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
              Secure checkout
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{checkout.description}</h2>
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

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-navy/10 bg-sand px-4 py-3">
          <ShieldCheck className="h-5 w-5 flex-shrink-0 text-navy" />
          <div>
            <p className="text-sm font-semibold text-navy">{checkout.merchantName}</p>
            <p className="text-xs text-ink/60">
              Amount: {formatCurrency(checkout.amount, checkout.currency)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              checkout={checkout}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </Elements>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/40">
          <Lock className="h-3 w-3" />
          <span>Powered by Stripe — PCI DSS compliant</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main payments experience ───────────────────────────────────────────── */
export function PaymentsExperience() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const accessToken = session?.accessToken;

  // Active Stripe checkout session
  const [stripeCheckout, setStripeCheckout] = useState<PaymentCheckoutResponse | null>(null);
  const [paymentError, setPaymentError]   = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const paymentsQuery = useQuery({
    queryKey: ["payments-dashboard", accessToken ?? "guest"],
    queryFn: () => getPaymentsDashboard(accessToken),
    enabled: Boolean(accessToken)
  });

  const verifyMutation = useMutation({
    mutationFn: (request: {
      paymentId: string;
      providerOrderId?: string;
      providerPaymentId?: string;
      providerSignature?: string;
    }) => verifyPayment(request, accessToken),
    onSuccess: (response) => {
      setPaymentError(null);
      setPaymentSuccess(response.message ?? "Payment completed successfully.");
      setStripeCheckout(null);
      queryClient.invalidateQueries({ queryKey: ["payments-dashboard", accessToken ?? "guest"] });
    },
    onError: (error) => {
      setPaymentError(error instanceof Error ? error.message : "Payment verification failed.");
    }
  });

  const handleStripeSuccess = useCallback(
    (paymentIntentId: string, checkout: PaymentCheckoutResponse) => {
      verifyMutation.mutate({
        paymentId: checkout.paymentId,
        providerOrderId: checkout.orderId,
        providerPaymentId: paymentIntentId,
        providerSignature: undefined
      });
    },
    [verifyMutation]
  );

  const checkoutMutation = useMutation({
    mutationFn: (paymentId: string) => createPaymentCheckout({ paymentId }, accessToken),
    onSuccess: async (checkout) => {
      setPaymentError(null);
      try {
        if (checkout.status === "CAPTURED") {
          setPaymentSuccess("This payment was already completed and synced from Stripe.");
          setStripeCheckout(null);
          queryClient.invalidateQueries({ queryKey: ["payments-dashboard", accessToken ?? "guest"] });
          return;
        }

        // ── Stripe flow ──
        if (checkout.providerMode === "STRIPE") {
          if (!checkout.clientSecret || !checkout.keyId) {
            throw new Error(
              "Stripe checkout failed: the backend did not return the client secret or publishable key. Check that STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY are set correctly in your .env."
            );
          }
          setStripeCheckout(checkout);
          return;
        }

        // ── Razorpay flow (kept for backward compat) ──
        if (checkout.providerMode === "RAZORPAY") {
          if (!checkout.keyId) {
            throw new Error("Razorpay checkout is active, but the public key is missing.");
          }
          const scriptUrl =
            paymentsQuery.data?.gateway.checkoutScriptUrl ?? "https://checkout.razorpay.com/v1/checkout.js";
          await loadRazorpayScript(scriptUrl);
          if (!window.Razorpay) throw new Error("Razorpay is not available in this browser.");

          const rz = new window.Razorpay({
            key: checkout.keyId,
            amount: checkout.amount * 100,
            currency: checkout.currency,
            name: checkout.merchantName,
            description: checkout.description,
            order_id: checkout.orderId,
            prefill: {
              name: checkout.customerName,
              email: checkout.customerEmail,
              contact: checkout.customerContact
            },
            handler: (response: Record<string, unknown>) => {
              verifyMutation.mutate({
                paymentId: checkout.paymentId,
                providerOrderId: String(response.razorpay_order_id ?? checkout.orderId),
                providerPaymentId: String(response.razorpay_payment_id ?? ""),
                providerSignature: String(response.razorpay_signature ?? "")
              });
            },
            modal: { ondismiss: () => setPaymentError("Payment was not completed. Please try again.") },
            theme: { color: "#1B3A6B" }
          });
          rz.open();
          return;
        }

        // ── MOCK sandbox flow ──
        if (checkout.providerMode !== "MOCK") {
          throw new Error(`Unsupported payment provider: ${checkout.providerMode}`);
        }
        const confirmed = window.confirm(
          "Sandbox mode is active. Click OK to simulate a successful test payment."
        );
        if (!confirmed) {
          setPaymentError("Sandbox payment was cancelled.");
          return;
        }
        verifyMutation.mutate({
          paymentId: checkout.paymentId,
          providerOrderId: checkout.orderId,
          providerPaymentId: `mock_pay_${checkout.paymentId}`,
          providerSignature: "mock_signature"
        });
      } catch (error) {
        setPaymentError(error instanceof Error ? error.message : "Checkout could not be started.");
      }
    },
    onError: (error) => {
      setPaymentError(error instanceof Error ? error.message : "Checkout could not be started. Please ensure you are signed in as a TENANT account.");
    }
  });

  /* ── Unauthenticated state ── */
  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Payments</span>
          <h1 className="mt-5 font-serif text-5xl text-oat">
            Sign in to open your payment journey
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-oat/76">
            Tenants can pay booking and rent dues here, while owners can review collections and
            payment history from the same dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/account/login">
              Sign in
            </Link>
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

  const dashboard = paymentsQuery.data;
  const dueItems = dashboard?.tenantOverview?.upcomingDues ?? [];

  return (
    <>
      {/* ── Stripe checkout modal (conditionally rendered) ── */}
      {stripeCheckout && (
        <StripeCheckoutModal
          checkout={stripeCheckout}
          onClose={() => setStripeCheckout(null)}
          onSuccess={(piId) => handleStripeSuccess(piId, stripeCheckout)}
        />
      )}

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* ── Hero banner ── */}
        <section className="hero-panel px-8 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative z-10">
              <span className="eyebrow-pill">Payments</span>
              <h1 className="mt-6 font-serif text-5xl leading-[1.02] text-oat md:text-6xl">
                {dashboard?.role === "OWNER"
                  ? "Track collections and incoming tenant payments."
                  : "Handle rent, deposit, and booking payments with clarity."}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-oat/76">
                {dashboard?.gateway.guidance ??
                  "This workspace keeps the payment trail visible to both sides of the rental journey."}
              </p>
            </div>

            <div className="dark-panel relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/58">
                Payment gateway
              </p>
              <p className="mt-4 text-2xl font-semibold text-oat">
                {dashboard?.gateway.providerLabel ?? "Loading…"}
              </p>
              <p className="mt-3 text-sm leading-6 text-oat/72">
                {dashboard?.gateway.providerMode === "STRIPE"
                  ? "Stripe is active — card payments are secured via Stripe Elements."
                  : dashboard?.gateway.providerMode === "RAZORPAY"
                  ? "Razorpay gateway checkout is active for this environment."
                  : "Sandbox mode — no real charges are made. Add Stripe keys to go live."}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Mode</p>
                  <p className="mt-2 font-serif text-3xl text-oat">
                    {dashboard?.gateway.providerMode ?? "…"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Keys configured</p>
                  <p className="mt-2 font-serif text-3xl text-oat">
                    {dashboard?.gateway.publicKeyAvailable ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Inline payment error banner ── */}
        {paymentError && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <span className="mt-0.5 flex-shrink-0 font-bold text-red-500">!</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-700">Payment error</p>
              <p className="mt-0.5 text-xs text-red-600">{paymentError}</p>
            </div>
            <button type="button" onClick={() => setPaymentError(null)} className="flex-shrink-0 text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Inline payment success banner ── */}
        {paymentSuccess && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <p className="flex-1 text-sm font-semibold text-emerald-700">{paymentSuccess}</p>
            <button type="button" onClick={() => setPaymentSuccess(null)} className="flex-shrink-0 text-emerald-400 hover:text-emerald-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Tenant view ── */}
        {dashboard?.role === "TENANT" ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="section-panel">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                    Pending dues
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">
                    Pay the next amount that matters
                  </h2>
                </div>
                <div className="rounded-lg bg-navy/10 px-4 py-2 text-sm font-semibold text-navy">
                  {dashboard.tenantOverview
                    ? formatCurrency(
                        dashboard.tenantOverview.pendingAmount,
                        dashboard.history[0]?.currency
                      )
                    : "Loading"}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {dueItems.length > 0 ? (
                  dueItems.map((payment) => (
                    <div
                      className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft"
                      key={payment.paymentId}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-azure">
                            {payment.paymentLabel}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-ink">
                            {payment.listingTitle}
                          </h3>
                          <p className="mt-1 text-sm text-ink/68">
                            {payment.locality}, {payment.city} · {payment.ownerName}
                          </p>
                        </div>
                        <p className="rounded-lg bg-navy/10 px-4 py-2 text-sm font-semibold text-navy">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-ink/68">Due {formatDate(payment.dueDate)}</p>
                        <button
                          className="button-primary"
                          disabled={checkoutMutation.isPending || verifyMutation.isPending}
                          onClick={() => checkoutMutation.mutate(payment.paymentId)}
                          type="button"
                        >
                          {checkoutMutation.isPending ? "Starting checkout…" : "Pay now"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-ink/68">
                    No pending payments are waiting right now.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="section-panel">
                <Wallet className="h-5 w-5 text-azure" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                  Tenant payment summary
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-soft">
                    <p className="text-xs uppercase tracking-[0.18em] text-azure/80">
                      Pending amount
                    </p>
                    <p className="mt-2 font-serif text-4xl text-ink">
                      {dashboard?.tenantOverview
                        ? formatCurrency(
                            dashboard.tenantOverview.pendingAmount,
                            dashboard.history[0]?.currency
                          )
                        : "…"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-soft">
                    <p className="text-xs uppercase tracking-[0.18em] text-azure/80">
                      Paid historically
                    </p>
                    <p className="mt-2 font-serif text-4xl text-ink">
                      {dashboard?.tenantOverview
                        ? formatCurrency(
                            dashboard.tenantOverview.capturedAmount,
                            dashboard.history[0]?.currency
                          )
                        : "…"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="section-panel">
                <CreditCard className="h-5 w-5 text-azure" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                  Payment history
                </p>
                <div className="mt-6 grid gap-4">
                  {(dashboard?.history ?? []).map((item) => (
                    <div
                      className="rounded-2xl border border-black/8 bg-white p-4 shadow-soft"
                      key={item.paymentId}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">{item.paymentLabel}</p>
                          <p className="mt-1 text-sm text-ink/68">{item.listingTitle}</p>
                        </div>
                        <p className="text-sm font-semibold text-navy">
                          {formatCurrency(item.amount, item.currency)}
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-ink/60">
                        {item.status} · {item.counterpartyName} ·{" "}
                        {item.paidAt ? formatDate(item.paidAt) : formatDate(item.dueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ── Owner view ── */
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="section-panel">
              <BadgeIndianRupee className="h-5 w-5 text-azure" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                Collections overview
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.18em] text-azure/80">
                    Collected this month
                  </p>
                  <p className="mt-2 font-serif text-4xl text-ink">
                    {dashboard?.ownerOverview
                      ? formatCurrency(
                          dashboard.ownerOverview.collectedThisMonth,
                          dashboard.history[0]?.currency
                        )
                      : "…"}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.18em] text-azure/80">
                    Pending collections
                  </p>
                  <p className="mt-2 font-serif text-4xl text-ink">
                    {dashboard?.ownerOverview
                      ? formatCurrency(
                          dashboard.ownerOverview.pendingAmount,
                          dashboard.history[0]?.currency
                        )
                      : "…"}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.18em] text-azure/80">
                    Collected payments
                  </p>
                  <p className="mt-2 font-serif text-4xl text-ink">
                    {dashboard?.ownerOverview?.collectedCount ?? "…"}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/8 bg-white px-5 py-4 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.18em] text-azure/80">
                    Listings covered
                  </p>
                  <p className="mt-2 font-serif text-4xl text-ink">
                    {dashboard?.ownerOverview?.listingsCovered ?? "…"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="button-primary" href="/owner/dashboard">
                  Open owner dashboard
                </Link>
                <Link className="button-secondary" href="/search">
                  Review public search
                </Link>
              </div>
            </div>

            <div className="section-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-azure">
                Recent payment activity
              </p>
              <div className="mt-6 grid gap-4">
                {(dashboard?.history ?? []).map((item) => (
                  <div
                    className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft"
                    key={item.paymentId}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.paymentLabel}</p>
                        <p className="mt-1 text-sm text-ink/68">
                          {item.listingTitle} · {item.counterpartyName}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-navy">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-ink/60">
                      {item.status} ·{" "}
                      {item.paidAt ? formatDate(item.paidAt) : formatDate(item.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
