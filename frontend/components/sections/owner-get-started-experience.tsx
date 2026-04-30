"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Building2, Home, Landmark, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { startOwnerAccess } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

const ownerGetStartedSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().min(10, "Enter a valid phone number with country code"),
  password: z.string().min(8, "Enter a password with at least 8 characters"),
  title: z.string().min(6, "Enter a stronger property title"),
  propertyType: z.string().min(3, "Enter the property type"),
  city: z.string().min(2, "Enter the city"),
  locality: z.string().min(2, "Enter the locality"),
  rent: z.coerce.number().min(1000, "Enter a realistic monthly rent"),
  deposit: z.coerce.number().min(0, "Deposit must be zero or higher"),
  bhk: z.string().min(2, "Enter the BHK configuration"),
  furnishing: z.string().min(2, "Enter the furnishing status"),
  amenities: z.string().min(2, "Add at least one amenity"),
  photos: z.string().url("Enter a valid cover photo URL")
});

type OwnerGetStartedValues = z.infer<typeof ownerGetStartedSchema>;

const OWNER_CITY_OPTIONS = ["Bengaluru", "Pune", "Hyderabad", "NCR-Delhi", "Chennai"] as const;

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OwnerGetStartedExperience() {
  const router = useRouter();
  const { session, setSession } = useAuthStore();
  const form = useForm<OwnerGetStartedValues>({
    resolver: zodResolver(ownerGetStartedSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "+91",
      password: "",
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

  const getStartedMutation = useMutation({
    mutationFn: (values: OwnerGetStartedValues) =>
      startOwnerAccess({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        title: values.title,
        propertyType: values.propertyType,
        city: values.city,
        locality: values.locality,
        rent: values.rent,
        deposit: values.deposit,
        bhk: values.bhk,
        furnishing: values.furnishing,
        amenities: splitCsv(values.amenities),
        photos: [values.photos]
      }),
    onSuccess: (response) => {
      setSession(response.session);
      router.replace(response.dashboardHref);
    },
    onError: () => {
      // error is surfaced via lastErrorMessage below
    }
  });

  const lastErrorMessage =
    getStartedMutation.error instanceof Error ? getStartedMutation.error.message : null;

  if (session?.role === "OWNER") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Owner workspace</span>
          <h1 className="mt-5 font-serif text-5xl text-oat">You already have an owner account open.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-oat/76">
            Your current session can already create and manage homes. Open the dashboard to add
            the next live listing instead of creating a second owner account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/owner/dashboard">
              Open owner dashboard
            </Link>
            <Link
              className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine"
              href="/payments"
            >
              Review collections
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (session?.role === "TENANT") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <span className="eyebrow-pill">List your property</span>
          <h1 className="mt-5 font-serif text-4xl text-ink">
            Sign out of the renter account before creating a separate owner account.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/74">
            Owner uploads live in a separate owner identity so listings, payments, and renter
            activity do not get mixed together under one account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-primary" href="/account/logout">
              Sign out first
            </Link>
            <Link className="button-secondary" href="/tenant/dashboard">
              Return to renter dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.14fr_0.86fr] lg:items-end">
          <div className="relative z-10">
            <span className="eyebrow-pill">List your property</span>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              Create your owner account and publish the first home in one calmer step.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/78 md:text-lg">
              This path is for owners who do not yet have an account in the app. Add your contact
              details, save a password for future sign-in, and publish the first property
              immediately.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/owner/login">
                Already have an owner login?
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/account/register">
                Need renter registration?
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/search">
                Browse current listings
              </Link>
            </div>
          </div>

          <div className="dark-panel relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/62">
              What this creates
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-oat/76">
              <p>A real owner account with your email, phone number, and password.</p>
              <p>Your first owner-managed property, ready for renter discovery.</p>
              <p>An active session so you can keep editing the property right away.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
        <aside className="grid gap-4">
          <div className="grain-card rounded-[32px] border border-white/70 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Owner onboarding
            </p>
            <div className="mt-5 grid gap-4">
              {[
                {
                  icon: Landmark,
                  title: "One owner account",
                  detail: "Keep listing edits, collections, and responses under a single owner identity."
                },
                {
                  icon: Building2,
                  title: "First listing included",
                  detail: "We publish the first property immediately so you land in a useful dashboard."
                },
                {
                  icon: ShieldCheck,
                  title: "Reusable sign-in",
                  detail: "The password you save here works later with the standard sign-in page."
                },
                {
                  icon: Home,
                  title: "Ready for uploads",
                  detail: "Photos, amenities, rent, locality, and BHK details are carried into the owner workspace."
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

          <div className="grain-card rounded-[32px] border border-white/70 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              What happens next
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-ink/74">
              <p><span className="font-semibold text-ink">1.</span> Save the owner account and first listing below.</p>
              <p><span className="font-semibold text-ink">2.</span> Land in the owner dashboard already signed in.</p>
              <p><span className="font-semibold text-ink">3.</span> Add more photos, listings, or payment tracking from there.</p>
            </div>
          </div>
        </aside>

        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Owner account and first property
          </p>
          <form className="mt-6 grid gap-6" onSubmit={form.handleSubmit((values) => getStartedMutation.mutate(values))}>
            <div>
              <h2 className="font-serif text-3xl text-ink">Start with the owner details</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <label className="field-label">
                  Full name
                  <input className="form-control mt-2" {...form.register("fullName")} />
                  <span className="mt-2 block text-xs text-copper">{form.formState.errors.fullName?.message}</span>
                </label>
                <label className="field-label">
                  Email
                  <input className="form-control mt-2" type="email" {...form.register("email")} />
                  <span className="mt-2 block text-xs text-copper">{form.formState.errors.email?.message}</span>
                </label>
                <label className="field-label">
                  Phone number
                  <input className="form-control mt-2" {...form.register("phoneNumber")} />
                  <span className="mt-2 block text-xs text-copper">{form.formState.errors.phoneNumber?.message}</span>
                </label>
                <label className="field-label">
                  Password
                  <input className="form-control mt-2" type="password" {...form.register("password")} />
                  <span className="mt-2 block text-xs text-copper">{form.formState.errors.password?.message}</span>
                </label>
              </div>
            </div>

            <div className="surface-divider" />

            <div>
              <h2 className="font-serif text-3xl text-ink">Add the first property listing</h2>
              <div className="mt-4 grid gap-5">
                <label className="field-label">
                  Property title
                  <input className="form-control mt-2" {...form.register("title")} />
                  <span className="mt-2 block text-xs text-copper">{form.formState.errors.title?.message}</span>
                </label>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="field-label">
                    Property type
                    <input className="form-control mt-2" {...form.register("propertyType")} />
                    <span className="mt-2 block text-xs text-copper">{form.formState.errors.propertyType?.message}</span>
                  </label>
                  <label className="field-label">
                    BHK
                    <input className="form-control mt-2" {...form.register("bhk")} />
                    <span className="mt-2 block text-xs text-copper">{form.formState.errors.bhk?.message}</span>
                  </label>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="field-label">
                    City
                    <select className="form-control mt-2" {...form.register("city")}>
                      {OWNER_CITY_OPTIONS.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 block text-xs text-copper">{form.formState.errors.city?.message}</span>
                  </label>
                  <label className="field-label">
                    Locality
                    <input className="form-control mt-2" {...form.register("locality")} />
                    <span className="mt-2 block text-xs text-copper">{form.formState.errors.locality?.message}</span>
                  </label>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="field-label">
                    Monthly rent
                    <input className="form-control mt-2" type="number" {...form.register("rent")} />
                    <span className="mt-2 block text-xs text-copper">{form.formState.errors.rent?.message}</span>
                  </label>
                  <label className="field-label">
                    Deposit
                    <input className="form-control mt-2" type="number" {...form.register("deposit")} />
                    <span className="mt-2 block text-xs text-copper">{form.formState.errors.deposit?.message}</span>
                  </label>
                </div>
                <label className="field-label">
                  Furnishing
                  <input className="form-control mt-2" {...form.register("furnishing")} />
                  <span className="mt-2 block text-xs text-copper">{form.formState.errors.furnishing?.message}</span>
                </label>
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
            </div>

            <button className="button-primary justify-center" disabled={getStartedMutation.isPending} type="submit">
              {getStartedMutation.isPending
                ? "Creating owner account..."
                : "Create owner account and open dashboard"}
            </button>

            {lastErrorMessage ? (
              <p className="rounded-2xl bg-copper/10 px-4 py-3 text-sm text-copper">
                {lastErrorMessage}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
