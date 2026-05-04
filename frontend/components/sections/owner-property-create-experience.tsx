"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Crown, Home, MapPinned, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createOwnerListing,
  getCurrentUserProfile,
  getOwnerListings,
  getOwnerPremiumAccess,
  activateOwnerPremium
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

const ownerListingSchema = z.object({
  title: z.string().min(4, "Enter a stronger listing title"),
  propertyType: z.string().min(3, "Choose a property type"),
  city: z.string().min(2, "Choose the city"),
  locality: z.string().min(2, "Enter the locality"),
  rent: z.coerce.number().min(1000, "Enter a realistic monthly rent"),
  deposit: z.coerce.number().min(0, "Deposit must be zero or higher"),
  bhk: z.string().min(2, "Choose the BHK configuration"),
  furnishing: z.string().min(2, "Choose the furnishing status"),
  amenities: z.string().min(2, "Add at least one amenity"),
  photos: z.string().min(8, "Add at least one photo URL")
});

type OwnerListingValues = z.infer<typeof ownerListingSchema>;

const CITY_OPTIONS = [
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { label: "Pune", lat: 18.5204, lng: 73.8567 },
  { label: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { label: "NCR-Delhi", lat: 28.6139, lng: 77.209 },
  { label: "Chennai", lat: 13.0827, lng: 80.2707 }
] as const;

const PROPERTY_TYPE_OPTIONS = ["Apartment", "Independent House", "Villa", "Studio", "PG"] as const;
const BHK_OPTIONS = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK"] as const;
const FURNISHING_OPTIONS = ["Unfurnished", "Semi Furnished", "Fully Furnished"] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cityCoordinates(city: string) {
  return CITY_OPTIONS.find((option) => option.label === city) ?? CITY_OPTIONS[0];
}

export function OwnerPropertyCreateExperience() {
  const queryClient = useQueryClient();
  const { session, statusMessage, setStatusMessage } = useAuthStore();
  const accessToken = session?.accessToken;
  const [listingMsg, setListingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [latestListingId, setLatestListingId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["owner-profile", accessToken ?? "guest"],
    queryFn: () => getCurrentUserProfile(accessToken),
    enabled: Boolean(accessToken)
  });

  const listingsQuery = useQuery({
    queryKey: ["owner-listings", accessToken ?? "guest"],
    queryFn: () => getOwnerListings({ page: 0, pageSize: 6 }, accessToken),
    enabled: Boolean(accessToken)
  });

  const ownerPremiumQuery = useQuery({
    queryKey: ["owner-premium", accessToken ?? "guest"],
    queryFn: () => getOwnerPremiumAccess(accessToken),
    enabled: Boolean(accessToken)
  });

  const form = useForm<OwnerListingValues>({
    resolver: zodResolver(ownerListingSchema),
    defaultValues: {
      title: "",
      propertyType: "Apartment",
      city: "Bengaluru",
      locality: "",
      rent: 28000,
      deposit: 84000,
      bhk: "2BHK",
      furnishing: "Semi Furnished",
      amenities: "Lift, Security, Power Backup",
      photos: "https://images.example.com/owners/new-listing-cover.jpg"
    }
  });

  const createListingMutation = useMutation({
    mutationFn: (values: OwnerListingValues) => {
      const coordinates = cityCoordinates(values.city);
      return createOwnerListing(
        {
          title: values.title,
          propertyType: values.propertyType,
          city: values.city,
          locality: values.locality,
          rent: values.rent,
          deposit: values.deposit,
          bhk: values.bhk,
          furnishing: values.furnishing,
          amenities: splitCsv(values.amenities),
          photos: splitCsv(values.photos),
          lat: coordinates.lat,
          lng: coordinates.lng
        },
        accessToken
      );
    },
    onSuccess: (data) => {
      setLatestListingId(data.listingId);
      setListingMsg({
        type: "success",
        text:
          data.status === "PUBLISHED"
            ? "Listing published successfully. It is now available in renter discovery and your owner inventory."
            : "Property draft saved. Activate Owner Premium from your wallet when you are ready to publish it."
      });
      queryClient.invalidateQueries({ queryKey: ["owner-listings", accessToken ?? "guest"] });
      form.reset({
        ...form.getValues(),
        title: "",
        locality: ""
      });
    },
    onError: (error) => {
      setListingMsg({
        type: "error",
        text: error instanceof Error ? error.message : "Property publishing failed. Please try again."
      });
    }
  });

  const activateOwnerPremiumMutation = useMutation({
    mutationFn: () => activateOwnerPremium(accessToken),
    onSuccess: (res) => {
      setListingMsg({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["owner-premium", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-dashboard", accessToken ?? "guest"] });
    },
    onError: (error) => {
      setListingMsg({
        type: "error",
        text: error instanceof Error ? error.message : "Could not activate Owner Premium."
      });
    }
  });

  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Add property</span>
          <h1 className="mt-5 font-serif text-5xl text-oat">Sign in as an owner to add a new property</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-oat/76">
            Property publishing belongs in the owner workspace. Sign in with your owner account to
            create a listing that flows into renter discovery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/owner/login">
              Owner sign in
            </Link>
            <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/owner/register">
              Create owner account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-sm text-ink/70">Loading your owner publishing workspace…</p>
        </section>
      </main>
    );
  }

  const resolvedRole = profileQuery.data?.role ?? session.role ?? null;

  if (resolvedRole !== "OWNER") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Add property</p>
          <h1 className="mt-3 font-serif text-4xl text-ink">This page is only for owner accounts</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">
            Renter accounts can continue browsing and paying dues, but adding a property is limited
            to the owner workspace so the roles stay clear.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href="/tenant/dashboard">
              Open renter dashboard
            </Link>
            <Link className="button-secondary" href="/owner/login">
              Use owner sign-in instead
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const ownerPremium = ownerPremiumQuery.data;

  if (ownerPremiumQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-sm text-ink/70">Checking Owner Premium status…</p>
        </section>
      </main>
    );
  }

  const listings = listingsQuery.data?.items ?? [];
  const ownerPremiumActive = ownerPremium?.premiumActive === true;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="hero-panel px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative z-10">
            <span className="eyebrow-pill">Owner property composer</span>
            <h1 className="mt-6 font-serif text-5xl leading-[1.02] text-oat md:text-6xl">
              Add a new property from a proper owner publishing page.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/76">
              {ownerPremiumActive
                ? "Use this page for the full property setup flow. Once published, the listing becomes part of renter discovery, search, and your live owner inventory."
                : "Use this page to save the property details as a draft first. Owner Premium is required only when you are ready to publish it for renters."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-accent" href="/owner/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to owner dashboard
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/search">
                Preview renter search
              </Link>
            </div>
          </div>

          <div className="dark-panel relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/60">
              Publishing checklist
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-oat/76">
              <p>Choose the city first so the property is routed into the right renter discovery feed.</p>
              <p>Use a strong listing title, realistic rent, and at least one clear photo URL.</p>
              <p>
                {ownerPremiumActive
                  ? "Publish once, then return to the owner dashboard to manage listings and tenant payments."
                  : "Save the draft now, then activate Owner Premium from wallet before renter visibility is switched on."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Property details
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {ownerPremiumActive ? "Publish a home with the essentials first" : "Save a property draft with the essentials first"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            {ownerPremiumActive
              ? "This flow is tuned for speed: capture the main details now, then refine the listing further from the dashboard once it is live."
              : "This flow is tuned for speed: capture the main details now, then publish from the premium owner flow once your wallet payment is complete."}
          </p>

          {listingMsg ? (
            <div
              className={[
                "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3",
                listingMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              ].join(" ")}
            >
              {listingMsg.type === "success" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <span className="mt-0.5 flex-shrink-0 font-bold text-red-500">!</span>
              )}
              <div className="flex-1">
                <p
                  className={[
                    "text-sm font-medium",
                    listingMsg.type === "success" ? "text-emerald-700" : "text-red-700"
                  ].join(" ")}
                >
                  {listingMsg.text}
                </p>
                {listingMsg.type === "success" ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link className="button-secondary" href="/owner/dashboard">
                      Return to dashboard
                    </Link>
                    {latestListingId ? (
                      <Link className="button-secondary" href={`/properties/${latestListingId}`}>
                        Open property page
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setListingMsg(null)}
                className="flex-shrink-0 text-ink/40 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {statusMessage ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <p className="flex-1 text-sm font-medium text-emerald-700">{statusMessage}</p>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="flex-shrink-0 text-ink/40 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {ownerPremiumQuery.isError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ownerPremiumQuery.error instanceof Error
                ? ownerPremiumQuery.error.message
                : "Could not load Owner Premium status."}
            </div>
          ) : null}

          {!ownerPremiumActive && ownerPremium ? (
            <div className="mt-5 rounded-xl border border-copper/20 bg-copper/8 p-5">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-copper" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                  Draft mode
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/72">
                You can save this property as a draft now. Activate Owner Premium from wallet to publish it into renter search and property detail pages.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/8 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink/48">Wallet balance</p>
                  <p className="mt-2 text-base font-semibold text-ink">{ownerPremium.walletBalanceFormatted}</p>
                  {ownerPremium.shortfallAmount > 0 ? (
                    <p className="mt-1 text-sm text-copper">
                      Add {formatCurrency(ownerPremium.shortfallAmount)} more before publishing.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-ink/62">Wallet is ready for Owner Premium.</p>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-3">
                  {ownerPremium.canActivate ? (
                    <button
                      className="button-primary justify-center"
                      disabled={activateOwnerPremiumMutation.isPending}
                      onClick={() => activateOwnerPremiumMutation.mutate()}
                      type="button"
                    >
                      <Crown className="h-4 w-4" />
                      {activateOwnerPremiumMutation.isPending ? "Activating…" : "Pay Owner Premium"}
                    </button>
                  ) : (
                    <Link className="button-primary justify-center" href="/wallet">
                      <Wallet className="h-4 w-4" />
                      Top up wallet
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <form className="mt-6 grid gap-6" onSubmit={form.handleSubmit((values) => createListingMutation.mutate(values))}>
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Property basics</p>
                <p className="mt-1 text-sm leading-6 text-ink/68">
                  Start with the title, home type, and city that should appear on the renter side.
                </p>
              </div>
              <label className="field-label">
                Listing title
                <input className="form-control mt-2" {...form.register("title")} />
                <span className="mt-2 block text-xs text-copper">{form.formState.errors.title?.message}</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="field-label">
                  Property type
                  <select className="form-control mt-2" {...form.register("propertyType")}>
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  City
                  <select className="form-control mt-2" {...form.register("city")}>
                    {CITY_OPTIONS.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  BHK
                  <select className="form-control mt-2" {...form.register("bhk")}>
                    {BHK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field-label">
                Locality
                <input className="form-control mt-2" {...form.register("locality")} />
                <span className="mt-2 block text-xs text-copper">{form.formState.errors.locality?.message}</span>
              </label>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Pricing and readiness</p>
                <p className="mt-1 text-sm leading-6 text-ink/68">
                  Use the real rent and deposit so the property has trustworthy pricing when it is published.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="field-label">
                  Monthly rent
                  <input className="form-control mt-2" type="number" {...form.register("rent")} />
                </label>
                <label className="field-label">
                  Deposit
                  <input className="form-control mt-2" type="number" {...form.register("deposit")} />
                </label>
                <label className="field-label">
                  Furnishing
                  <select className="form-control mt-2" {...form.register("furnishing")}>
                    {FURNISHING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Amenities and photo cover</p>
                <p className="mt-1 text-sm leading-6 text-ink/68">
                  Separate amenities with commas. You can add more photo URLs later if needed.
                </p>
              </div>
              <label className="field-label">
                Amenities
                <input className="form-control mt-2" {...form.register("amenities")} />
                <span className="mt-2 block text-xs text-copper">{form.formState.errors.amenities?.message}</span>
              </label>
              <label className="field-label">
                Cover photo URL
                <input className="form-control mt-2" {...form.register("photos")} />
                <span className="mt-2 block text-xs text-copper">{form.formState.errors.photos?.message}</span>
              </label>
            </div>

            <button className="button-primary mt-2" disabled={createListingMutation.isPending} type="submit">
              {createListingMutation.isPending
                ? ownerPremiumActive
                  ? "Publishing property..."
                  : "Saving draft..."
                : ownerPremiumActive
                  ? "Publish property"
                  : "Save property draft"}
            </button>
          </form>
        </div>

        <div className="grid gap-6">
          <div className="section-panel">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-copper" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Why this page exists
              </p>
            </div>
            <div className="mt-5 grid gap-4">
              {[
                {
                  icon: Home,
                  title: "Cleaner owner flow",
                  detail: "Property creation is separated from the management dashboard so owners are not forced to publish inside a crowded page."
                },
                {
                  icon: MapPinned,
                  title: "Correct city routing",
                  detail: "Published homes are attached to the selected city so the renter-facing feed and search experience stay aligned."
                },
                {
                  icon: Sparkles,
                  title: "Live renter visibility",
                  detail: "Once this form succeeds, the new home becomes visible in renter discovery and the tenant dashboard’s latest published homes section."
                }
              ].map((item) => (
                <div className="soft-panel" key={item.title}>
                  <item.icon className="h-5 w-5 text-copper" />
                  <p className="mt-3 text-base font-semibold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/72">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Recent owner inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Your current inventory</h2>
            <div className="mt-6 grid gap-4">
              {listings.length > 0 ? (
                listings.map((listing) => (
                  <div className="rounded-[24px] border border-black/8 bg-white/88 p-5" key={listing.listingId}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
                          {listing.status}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink">{listing.title}</p>
                        <p className="mt-1 text-sm uppercase tracking-[0.14em] text-pine">
                          {listing.locality}, {listing.city}
                        </p>
                      </div>
                      <p className="rounded-full bg-pine/10 px-4 py-2 text-sm font-semibold text-pine">
                        {formatCurrency(listing.rent)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-ink/70">
                  Your owner listings and drafts will appear here once you save the first property.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
