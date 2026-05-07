"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, IndianRupee, Layers3, Sparkles, Wallet, CreditCard, CheckCircle, X, Crown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createOwnerPaymentRecord,
  getCurrentUserProfile,
  getOwnerListings,
  getPaymentsDashboard,
  getOwnerPremiumAccess,
  activateOwnerPremium
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

const paymentRecordSchema = z.object({
  tenantEmail:  z.string().email("Enter a valid tenant email"),
  listingId:    z.string().min(1, "Select a listing"),
  amount:       z.coerce.number().min(1, "Amount must be at least ₹1"),
  paymentKind:  z.string().min(1, "Select payment type"),
  paymentLabel: z.string().min(2, "Enter a label, e.g. May 2026 rent"),
  dueDate:      z.string().optional(),
  description:  z.string().optional()
});

type PaymentRecordValues = z.infer<typeof paymentRecordSchema>;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function OwnerDashboardExperience() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const accessToken = session?.accessToken;

  const [paymentMsg, setPaymentMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);

  const paymentForm = useForm<PaymentRecordValues>({
    resolver: zodResolver(paymentRecordSchema),
    defaultValues: {
      tenantEmail:  "",
      listingId:    "",
      amount:       "" as unknown as number,
      paymentKind:  "MONTHLY_RENT",
      paymentLabel: "",
      dueDate:      "",
      description:  ""
    }
  });

  // Track whether the user has manually edited the amount field — once they do,
  // we stop auto-populating from the listing/payment-type combo so we don't clobber
  // their input. The flag resets when a new payment record is saved.
  const [amountManuallyEdited, setAmountManuallyEdited] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["owner-profile", accessToken ?? "guest"],
    queryFn: () => getCurrentUserProfile(accessToken),
    enabled: Boolean(accessToken)
  });

  const listingsQuery = useQuery({
    queryKey: ["owner-listings", accessToken ?? "guest"],
    queryFn: () => getOwnerListings({ page: 0, pageSize: 20 }, accessToken),
    enabled: Boolean(accessToken)
  });

  const paymentsQuery = useQuery({
    queryKey: ["owner-payments", accessToken ?? "guest"],
    queryFn: () => getPaymentsDashboard(accessToken),
    enabled: Boolean(accessToken)
  });

  const ownerPremiumQuery = useQuery({
    queryKey: ["owner-premium", accessToken ?? "guest"],
    queryFn: () => getOwnerPremiumAccess(accessToken),
    enabled: Boolean(accessToken)
  });

  const createPaymentMutation = useMutation({
    mutationFn: (values: PaymentRecordValues) =>
      createOwnerPaymentRecord(
        {
          tenantEmail:  values.tenantEmail,
          listingId:    values.listingId,
          amount:       values.amount,
          paymentKind:  values.paymentKind,
          paymentLabel: values.paymentLabel,
          dueDate:      values.dueDate || undefined,
          description:  values.description || undefined
        },
        accessToken
      ),
    onSuccess: (res) => {
      setPaymentMsg({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["owner-payments", accessToken ?? "guest"] });
      paymentForm.reset({
        tenantEmail: "",
        listingId: "",
        amount: "" as unknown as number,
        paymentKind: "MONTHLY_RENT",
        paymentLabel: "",
        dueDate: "",
        description: ""
      });
      // Reset manual-edit flag so the next record auto-fills again from the picked listing.
      setAmountManuallyEdited(false);
    },
    onError: (error) => {
      setPaymentMsg({ type: "error", text: error instanceof Error ? error.message : "Could not create payment record." });
    }
  });

  const activateOwnerPremiumMutation = useMutation({
    mutationFn: () => activateOwnerPremium(accessToken),
    onSuccess: (res) => {
      setPaymentMsg({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["owner-premium", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-dashboard", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["owner-listings", accessToken ?? "guest"] });
    },
    onError: (error) => {
      setPaymentMsg({
        type: "error",
        text: error instanceof Error ? error.message : "Could not activate Owner Premium."
      });
    }
  });

  // Bug H — auto-populate Amount based on the selected Listing ID + Payment Type.
  // Picks rent for MONTHLY_RENT / BOOKING_TOKEN, deposit for SECURITY_DEPOSIT.
  // Skips MAINTENANCE (no canonical amount in listing). Stops once the user has
  // manually edited the field so we don't clobber their input.
  const watchedListingId = paymentForm.watch("listingId");
  const watchedPaymentKind = paymentForm.watch("paymentKind");
  useEffect(() => {
    if (amountManuallyEdited) return;
    const items = listingsQuery.data?.items ?? [];
    const listing = items.find((l) => l.listingId === watchedListingId);
    if (!listing) return;

    let suggested: number | undefined;
    switch (watchedPaymentKind) {
      case "MONTHLY_RENT":
      case "BOOKING_TOKEN":
        suggested = listing.rent;
        break;
      case "SECURITY_DEPOSIT":
        suggested = listing.deposit;
        break;
      default:
        return; // MAINTENANCE — no canonical value, leave alone
    }

    if (suggested !== undefined) {
      paymentForm.setValue("amount", suggested, { shouldValidate: false });
      // Also suggest a sensible default label if the user hasn't typed one yet.
      const currentLabel = paymentForm.getValues("paymentLabel");
      if (!currentLabel) {
        const labelMap: Record<string, string> = {
          MONTHLY_RENT: "Monthly rent",
          SECURITY_DEPOSIT: "Security deposit",
          BOOKING_TOKEN: "Booking token"
        };
        const prefix = labelMap[watchedPaymentKind] ?? "Payment";
        paymentForm.setValue("paymentLabel", `${prefix} for ${listing.title}`, { shouldValidate: false });
      }
    }
  }, [watchedListingId, watchedPaymentKind, amountManuallyEdited, listingsQuery.data, paymentForm]);

  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Owner dashboard</span>
          <h1 className="mt-5 font-serif text-5xl text-oat">Sign in to manage homes and collections</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-oat/76">
            The owner dashboard ties listing management, payment collections, and public discovery into
            one workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/owner/login">
              Owner sign in
            </Link>
            <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/owner/register">
              Create owner account
            </Link>
            <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/">
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Wait for the profile API to confirm the role before deciding access.
  // Using session.role alone can flash "not an owner" for a fraction of a second
  // while the profile query is in-flight, so we hold until it settles.
  if (profileQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-sm text-ink/70">Loading your owner workspace…</p>
        </section>
      </main>
    );
  }

  const resolvedRole = profileQuery.data?.role ?? session.role ?? null;

  if (resolvedRole !== "OWNER") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Owner dashboard</p>
          <h1 className="mt-3 font-serif text-4xl text-ink">This account is not an owner account</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">
            Tenant sessions can still browse homes and pay dues, but listing management and owner
            collections stay in the owner workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href="/tenant/dashboard">
              Open renter dashboard
            </Link>
            <Link className="button-secondary" href="/payments">
              Open payments
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const listings = listingsQuery.data?.items ?? [];
  const publishedCount = listings.filter((listing) => listing.status === "PUBLISHED").length;
  const draftCount = listings.filter((listing) => listing.status === "DRAFT").length;
  const liveRentPotential = listings.reduce((sum, listing) => sum + listing.rent, 0);
  const ownerOverview = paymentsQuery.data?.ownerOverview;
  const ownerPremium = ownerPremiumQuery.data;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="hero-panel px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10">
            <span className="eyebrow-pill">Owner dashboard</span>
            <h1 className="mt-6 font-serif text-5xl leading-[1.02] text-oat md:text-6xl">
              {profileQuery.data?.fullName
                ? `${profileQuery.data.fullName}, manage homes and collections in one place.`
                : "Manage homes and collections in one place."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/76">
              Publish better listings, keep live inventory moving, and stay on top of tenant
              payments without leaving the app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-primary" href={ownerPremium?.premiumActive ? "/owner/listings/new" : "/wallet"}>
                Add new property
              </Link>
              <Link className="button-accent" href="/payments">
                Review collections
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/search">
                Explore the public search experience
              </Link>
            </div>
          </div>

          <div className="dark-panel relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/60">
              Owner performance snapshot
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Published listings</p>
                <p className="mt-2 font-serif text-4xl text-oat">{publishedCount}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Draft listings</p>
                <p className="mt-2 font-serif text-4xl text-oat">{draftCount}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Collected this month</p>
                <p className="mt-2 font-serif text-4xl text-oat">
                  {ownerOverview ? formatCurrency(ownerOverview.collectedThisMonth) : "..."}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-oat/54">Pending collections</p>
                <p className="mt-2 font-serif text-4xl text-oat">
                  {ownerOverview ? formatCurrency(ownerOverview.pendingAmount) : "..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 section-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Crown className="mt-1 h-5 w-5 text-copper" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Owner Premium
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">
                Pay from wallet before publishing
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
                Owner Premium is required for publishing listings. Use your wallet balance to
                activate the annual plan, then continue to the add-property page.
              </p>
            </div>
          </div>
          <Link className="button-secondary" href="/wallet">
            Open wallet
          </Link>
        </div>

        {ownerPremiumQuery.isLoading ? (
          <p className="mt-5 text-sm text-ink/60">Checking owner premium status…</p>
        ) : null}

        {ownerPremiumQuery.isError ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ownerPremiumQuery.error instanceof Error
              ? ownerPremiumQuery.error.message
              : "Could not load owner premium status."}
          </div>
        ) : null}

        {ownerPremium ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <div className="soft-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Plan</p>
              <p className="mt-2 text-lg font-semibold text-ink">{ownerPremium.planName}</p>
              <p className="mt-1 text-sm text-ink/64">
                {formatCurrency(ownerPremium.priceAmount)} · {ownerPremium.billingPeriod.toLowerCase()}
              </p>
            </div>
            <div className="soft-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Wallet</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {ownerPremium.walletBalanceFormatted}
              </p>
              <p className="mt-1 text-sm text-ink/64">{ownerPremium.message}</p>
              {ownerPremium.shortfallAmount > 0 ? (
                <p className="mt-2 text-sm font-semibold text-copper">
                  Shortfall: {formatCurrency(ownerPremium.shortfallAmount)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col justify-center gap-3 lg:min-w-56">
              {ownerPremium.premiumActive ? (
                <Link className="button-primary justify-center" href="/owner/listings/new">
                  Add property
                </Link>
              ) : (
                <button
                  className="button-primary justify-center"
                  disabled={!ownerPremium.canActivate || activateOwnerPremiumMutation.isPending}
                  onClick={() => activateOwnerPremiumMutation.mutate()}
                  type="button"
                >
                  {activateOwnerPremiumMutation.isPending ? "Activating…" : "Pay Owner Premium"}
                </button>
              )}
              {!ownerPremium.premiumActive && ownerPremium.shortfallAmount > 0 ? (
                <Link className="button-secondary justify-center" href="/wallet">
                  Top up wallet
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Live homes", value: publishedCount, icon: Building2 },
          { label: "Draft homes", value: draftCount, icon: Layers3 },
          { label: "Rent potential", value: formatCurrency(liveRentPotential), icon: IndianRupee },
          { label: "Listings with payments", value: ownerOverview?.listingsCovered ?? 0, icon: Wallet }
        ].map((metric) => (
          <div className="section-panel" key={metric.label}>
            <metric.icon className="h-5 w-5 text-copper" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              {metric.label}
            </p>
            <p className="mt-3 font-serif text-4xl text-ink">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Add property
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Use the dedicated owner publishing page</h2>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            The dashboard is now focused on management. When you want to publish a property, open
            the dedicated owner page built for property details, pricing, amenities, and renter-side
            visibility.
          </p>
          <div className="mt-6 grid gap-4">
            {[
              "Start from a cleaner owner-only property form.",
              "Publish into renter discovery without leaving owner space.",
              "Return here after publishing to manage live inventory and tenant payments."
            ].map((item) => (
              <div className="soft-panel" key={item}>
                <p className="text-sm leading-6 text-ink/74">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href="/owner/listings/new">
              Open add property page
            </Link>
            <Link className="button-secondary" href="/search">
              See renter discovery
            </Link>
          </div>
        </div>

        <div className="section-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Active listing flow
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Manage what tenants will see next</h2>
            </div>
            <Sparkles className="h-5 w-5 text-copper" />
          </div>
          <div className="mt-6 grid gap-4">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <div className="rounded-[28px] border border-black/8 bg-white/88 p-5 shadow-soft" key={listing.listingId}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
                        {listing.status}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-ink">{listing.title}</h3>
                      <p className="mt-1 text-sm uppercase tracking-[0.14em] text-pine">
                        {listing.locality}, {listing.city}
                      </p>
                    </div>
                    <p className="rounded-full bg-pine/10 px-4 py-2 text-sm font-semibold text-pine">
                      {formatCurrency(listing.rent)}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {listing.amenities.slice(0, 4).map((amenity) => (
                      <span
                        className="rounded-full border border-pine/10 bg-pine/6 px-3 py-1 text-xs font-medium text-pine"
                        key={`${listing.listingId}-${amenity}`}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/70">
                    <span>
                      {listing.bhk} • {listing.furnishing}
                    </span>
                    <span>Available from {listing.availabilityDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-ink/70">Your owner-managed listings will appear here.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Assign payment to tenant ── */}
      <section className="mt-8 section-panel">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-copper" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Assign payment to tenant
          </p>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Create a payment record for a tenant</h2>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          Enter the tenant&apos;s registered email and the listing this payment is for.
          The record will appear on their Payments page immediately, ready for Stripe checkout.
        </p>

        {paymentMsg && (
          <div className={[
            "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3",
            paymentMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          ].join(" ")}>
            {paymentMsg.type === "success"
              ? <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              : <span className="mt-0.5 flex-shrink-0 font-bold text-red-500">!</span>
            }
            <p className={[
              "flex-1 text-sm font-medium",
              paymentMsg.type === "success" ? "text-emerald-700" : "text-red-700"
            ].join(" ")}>{paymentMsg.text}</p>
            <button type="button" onClick={() => setPaymentMsg(null)} className="flex-shrink-0 text-ink/40 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={paymentForm.handleSubmit((values) => createPaymentMutation.mutate(values))}
        >
          <label className="field-label sm:col-span-2">
            Tenant email address
            <input
              className="form-control mt-2"
              placeholder="tenant@example.com"
              {...paymentForm.register("tenantEmail")}
            />
            <span className="mt-1 block text-xs text-copper">
              {paymentForm.formState.errors.tenantEmail?.message}
            </span>
          </label>

          <label className="field-label sm:col-span-2">
            Listing ID
            <select className="form-control mt-2" {...paymentForm.register("listingId")}>
              <option value="">— select a listing —</option>
              {listings.map((l) => (
                <option key={l.listingId} value={l.listingId}>
                  {l.title} ({l.locality}, {l.city})
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-copper">
              {paymentForm.formState.errors.listingId?.message}
            </span>
          </label>

          <label className="field-label">
            Payment type
            <select className="form-control mt-2" {...paymentForm.register("paymentKind")}>
              <option value="MONTHLY_RENT">Monthly Rent</option>
              <option value="SECURITY_DEPOSIT">Security Deposit</option>
              <option value="BOOKING_TOKEN">Booking Token</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </label>

          <label className="field-label">
            Amount (₹)
            <input
              className="form-control mt-2"
              type="number"
              min="1"
              {...paymentForm.register("amount", {
                onChange: () => setAmountManuallyEdited(true)
              })}
            />
            <span className="mt-1 block text-xs text-ink/52">
              Auto-filled from the listing&apos;s rent / deposit. You can override.
            </span>
            <span className="mt-1 block text-xs text-copper">
              {paymentForm.formState.errors.amount?.message}
            </span>
          </label>

          <label className="field-label">
            Payment label
            <input
              className="form-control mt-2"
              placeholder="e.g. May 2026 rent"
              {...paymentForm.register("paymentLabel")}
            />
            <span className="mt-1 block text-xs text-copper">
              {paymentForm.formState.errors.paymentLabel?.message}
            </span>
          </label>

          <label className="field-label">
            Due date
            <input
              className="form-control mt-2"
              type="date"
              {...paymentForm.register("dueDate")}
            />
          </label>

          <label className="field-label sm:col-span-2">
            Description (optional)
            <input
              className="form-control mt-2"
              placeholder="e.g. Monthly rent for 2BHK in Indiranagar"
              {...paymentForm.register("description")}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              className="button-primary"
              disabled={createPaymentMutation.isPending}
              type="submit"
            >
              {createPaymentMutation.isPending ? "Creating…" : "Create payment record"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
