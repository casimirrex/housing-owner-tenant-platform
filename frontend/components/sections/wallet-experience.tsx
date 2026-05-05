"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Plus,
  X,
  Lock,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowDownCircle,
  Crown
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
  verifyWalletTopup,
  getTenantPremiumAccess,
  activateTenantPremium,
  getOwnerPremiumAccess,
  activateOwnerPremium
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

/* ─── Demo card payment form (cosmetic, MOCK mode only) ──────────────────── */
/**
 * Visual-only credit card form for the demo. Card number, expiry, and CVV are
 * NEVER sent to the backend or stored anywhere — they exist purely to make the
 * demo look like a real payment form. On submit, this calls the existing
 * MOCK-mode top-up flow which auto-credits the wallet server-side.
 *
 * To switch to the real PCI-compliant Stripe Elements form, set
 * PAYMENT_PROVIDER=STRIPE in the backend .env and provide real Stripe keys.
 */
interface DemoCardPaymentFormProps {
  checkout: WalletTopupCheckoutResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

// Pre-filled demo values — visible to the user so the client can run the flow
// without any typing. All four fields stay editable if they want to change them.
const DEMO_CARDHOLDER = "DEMO USER";
const DEMO_CARD_NUMBER = "4242 4242 4242 4242";
const DEMO_EXPIRY = "12/34";
const DEMO_CVV = "123";

function DemoCardPaymentForm({ checkout, onSuccess, onCancel }: DemoCardPaymentFormProps) {
  const [cardholder, setCardholder] = useState(DEMO_CARDHOLDER);
  const [cardNumber, setCardNumber] = useState(DEMO_CARD_NUMBER);
  const [expiry, setExpiry] = useState(DEMO_EXPIRY);
  const [cvv, setCvv] = useState(DEMO_CVV);
  const [processing, setProcessing] = useState(false);

  const fillDemoValues = () => {
    setCardholder(DEMO_CARDHOLDER);
    setCardNumber(DEMO_CARD_NUMBER);
    setExpiry(DEMO_EXPIRY);
    setCvv(DEMO_CVV);
  };

  const formatCardNumber = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const isValid =
    cardholder.trim().length >= 2 &&
    cardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    /^\d{3,4}$/.test(cvv);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || processing) return;
    setProcessing(true);
    // Small artificial delay so the UX feels like a real payment
    setTimeout(() => {
      onSuccess();
    }, 700);
  };

  const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4) || "••••";

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        <p>
          <strong>Demo payment</strong> — sandbox only, no real card data is
          transmitted or stored. We&apos;ve pre-filled the demo card values
          below; just click <strong>Pay</strong> to continue.
        </p>
        <div className="mt-2 grid gap-1 font-mono text-[11px] text-amber-900">
          <p>
            Card: <strong>{DEMO_CARD_NUMBER}</strong>
          </p>
          <p>
            Expiry: <strong>{DEMO_EXPIRY}</strong> &nbsp;·&nbsp; CVV:{" "}
            <strong>{DEMO_CVV}</strong>
          </p>
        </div>
        <button
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900 underline-offset-2 hover:underline"
          onClick={fillDemoValues}
          type="button"
        >
          Reset to demo values
        </button>
      </div>

      {/* Visual card preview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-pine p-5 text-oat shadow-soft">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] opacity-80">
            Demo Card
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">VISA</p>
        </div>
        <p className="mt-7 font-mono text-lg tracking-[0.18em]">
          {cardNumber || "•••• •••• •••• ••••"}
        </p>
        <div className="mt-5 flex items-end justify-between text-[10px] uppercase tracking-[0.18em] opacity-80">
          <div>
            <p className="opacity-70">Cardholder</p>
            <p className="mt-1 text-sm font-semibold tracking-normal">
              {cardholder || "YOUR NAME"}
            </p>
          </div>
          <div className="text-right">
            <p className="opacity-70">Expires</p>
            <p className="mt-1 text-sm font-semibold tracking-normal">{expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>

      {/* Form inputs */}
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
          Cardholder name
        </span>
        <input
          autoComplete="cc-name"
          className="form-control mt-1.5 w-full"
          onChange={(e) => setCardholder(e.target.value.toUpperCase())}
          placeholder="FULL NAME ON CARD"
          type="text"
          value={cardholder}
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
          Card number
        </span>
        <input
          autoComplete="cc-number"
          className="form-control mt-1.5 w-full font-mono tracking-[0.12em]"
          inputMode="numeric"
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="4242 4242 4242 4242"
          type="text"
          value={cardNumber}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
            Expiry (MM/YY)
          </span>
          <input
            autoComplete="cc-exp"
            className="form-control mt-1.5 w-full font-mono"
            inputMode="numeric"
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="12/34"
            type="text"
            value={expiry}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
            CVV
          </span>
          <input
            autoComplete="cc-csc"
            className="form-control mt-1.5 w-full font-mono"
            inputMode="numeric"
            maxLength={4}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            type="text"
            value={cvv}
          />
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          className="button-primary flex-1"
          disabled={!isValid || processing}
          type="submit"
        >
          {processing
            ? "Processing payment…"
            : `Pay ${fmtAmount(checkout.amount, checkout.currency)} now`}
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

      <div className="flex items-center justify-center gap-2 text-[11px] text-ink/40">
        <Lock className="h-3 w-3" />
        <span>Demo payment · ending in {cardLast4}</span>
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
            /* MOCK / sandbox — demo card form */
            <DemoCardPaymentForm
              checkout={checkout}
              onSuccess={() => onSuccess("mock_pi_" + checkout.txnId)}
              onCancel={onClose}
            />
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
  const router = useRouter();
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
  const accountRole = session?.role === "OWNER" ? "OWNER" : "TENANT";
  const premiumTitle = accountRole === "OWNER" ? "Owner Premium" : "Tenant Premium";

  const premiumQuery = useQuery({
    queryKey: ["wallet-premium-access", accountRole, accessToken ?? "guest"],
    queryFn: () =>
      accountRole === "OWNER"
        ? getOwnerPremiumAccess(accessToken)
        : getTenantPremiumAccess(accessToken),
    enabled: Boolean(accessToken)
  });

  const refreshWalletAndPremiumState = async () => {
    const walletKey = ["wallet-dashboard", accessToken ?? "guest"];
    const walletPremiumKey = ["wallet-premium-access", accountRole, accessToken ?? "guest"];
    const rolePremiumKey = accountRole === "OWNER" ? ["owner-premium"] : ["tenant-premium"];

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: walletKey }),
      queryClient.invalidateQueries({ queryKey: walletPremiumKey }),
      queryClient.invalidateQueries({ queryKey: rolePremiumKey }),
      queryClient.invalidateQueries({ queryKey: ["property-detail"] })
    ]);

    await Promise.all([
      walletQuery.refetch(),
      premiumQuery.refetch()
    ]);
  };

  const premiumAccess = premiumQuery.data;
  const effectiveWalletBalance =
    data?.balance ?? premiumAccess?.walletBalance ?? 0;
  const effectiveWalletBalanceFormatted =
    data?.balanceFormatted ??
    premiumAccess?.walletBalanceFormatted ??
    fmtAmount(effectiveWalletBalance, currency);
  const effectiveShortfallAmount =
    premiumAccess && !premiumAccess.premiumActive
      ? Math.max(0, premiumAccess.priceAmount - effectiveWalletBalance)
      : 0;
  const walletActivationUnavailable =
    premiumAccess?.message.toLowerCase().includes("only in local development") ?? false;
  const canPayPremiumFromWallet =
    Boolean(premiumAccess) &&
    !premiumAccess?.premiumActive &&
    !walletActivationUnavailable &&
    (premiumAccess?.canActivate === true || effectiveShortfallAmount === 0);
  const premiumReadinessMessage =
    premiumAccess && canPayPremiumFromWallet && !premiumAccess.canActivate
      ? `Your wallet balance is ready. You can activate ${premiumTitle} immediately.`
      : premiumAccess?.message;

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
    onSuccess: async (res) => {
      setApiError(null);
      setSuccessMsg(res.message ?? "Wallet topped up successfully!");
      setCheckout(null);
      setSelectedPreset(null);
      setCustomRupees("");
      await refreshWalletAndPremiumState();
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

  const premiumMutation = useMutation({
    mutationFn: () =>
      accountRole === "OWNER"
        ? activateOwnerPremium(accessToken)
        : activateTenantPremium(accessToken),
    onSuccess: async (res) => {
      setApiError(null);
      setSuccessMsg(res.message);
      await refreshWalletAndPremiumState();
      if (accountRole === "TENANT") {
        router.push("/search");
      } else if (accountRole === "OWNER") {
        router.push("/owner/listings/new");
      }
    },
    onError: (err) => {
      setApiError(
        err instanceof Error
          ? err.message
          : `Could not activate ${premiumTitle}. Please try again.`
      );
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

        {/* ── Premium payment from wallet ── */}
        <section className="mt-8 section-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-copper" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Premium payment
                </p>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Pay {premiumTitle} from wallet
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
                {accountRole === "OWNER"
                  ? "Owner Premium is required before publishing listings. The fee is deducted directly from your wallet balance."
                  : "Tenant Premium unlocks full property details. The fee is deducted directly from your wallet balance."}
              </p>
            </div>
            <Link className="button-secondary" href={accountRole === "OWNER" ? "/owner/dashboard" : "/search"}>
              {accountRole === "OWNER" ? "Owner dashboard" : "Browse homes"}
            </Link>
          </div>

          {premiumQuery.isLoading ? (
            <p className="mt-5 text-sm text-ink/60">Checking premium status…</p>
          ) : null}

          {premiumQuery.isError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {premiumQuery.error instanceof Error
                ? premiumQuery.error.message
                : "Could not load premium status."}
            </div>
          ) : null}

          {premiumAccess ? (
            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div className="rounded-xl border border-black/8 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Plan</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {premiumAccess.planName}
                </p>
                <p className="mt-1 text-sm text-ink/62">
                  {fmtAmount(premiumAccess.priceAmount, premiumAccess.currency)} ·{" "}
                  {premiumAccess.billingPeriod.toLowerCase()}
                </p>
              </div>

              <div className="rounded-xl border border-black/8 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Wallet readiness</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {effectiveWalletBalanceFormatted}
                </p>
                <p className="mt-1 text-sm text-ink/62">{premiumReadinessMessage}</p>
                {effectiveShortfallAmount > 0 ? (
                  <p className="mt-2 text-sm font-semibold text-copper">
                    Add {fmtAmount(effectiveShortfallAmount, premiumAccess.currency)} more
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col justify-center gap-3 md:min-w-56">
                {premiumAccess.premiumActive ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Premium active
                  </div>
                ) : (
                  <button
                    className="button-primary justify-center"
                    disabled={!canPayPremiumFromWallet || premiumMutation.isPending}
                    onClick={() => premiumMutation.mutate()}
                    type="button"
                  >
                    {premiumMutation.isPending ? "Activating…" : `Pay ${premiumTitle}`}
                  </button>
                )}

                {!premiumAccess.premiumActive && effectiveShortfallAmount > 0 ? (
                  <button
                    className="button-secondary justify-center"
                    onClick={() => {
                      setSelectedPreset(effectiveShortfallAmount);
                      setCustomRupees("");
                    }}
                    type="button"
                  >
                    Prepare top-up
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
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
