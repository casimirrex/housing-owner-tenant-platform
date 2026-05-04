import Link from "next/link";
import { BadgeCheck, Clock3, MapPinned, ShieldCheck } from "lucide-react";
import { HeroSearchForm } from "@/components/sections/hero-search-form";
import { HomeAccountJourneySpotlight } from "@/components/sections/home-account-journey-spotlight";
import { ListingCard } from "@/components/ui/listing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHome } from "@/lib/api/client";

const cities = ["Bengaluru", "Pune", "Hyderabad", "NCR-Delhi", "Chennai"];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const home = await getHome("Bengaluru");
  const featuredRecommendation = home.recommendations[0];

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hero-panel px-6 py-8 md:px-10 md:py-10">
            <span className="eyebrow-pill">Trust-first rentals</span>
            <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              Find the right rental without losing time or clarity.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-oat/78 md:text-lg">
              Search verified homes, register quickly, and continue into onboarding, visits, and
              payments from one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/search">
                Search homes
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/account/register">
                Registration
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/owner/register">
                List your home
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-5 py-4 text-oat">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-oat/60">
                  City live
                </p>
                <p className="mt-3 text-xl font-semibold">{home.heroSearchConfig.city}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-5 py-4 text-oat">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-oat/60">
                  Verified picks
                </p>
                <p className="mt-3 text-xl font-semibold">{home.premiumVerified.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-5 py-4 text-oat">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-oat/60">
                  New listings
                </p>
                <p className="mt-3 text-xl font-semibold">{home.newListings.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <HeroSearchForm
              defaultCity={home.heroSearchConfig.city}
              placeholder={home.heroSearchConfig.searchPlaceholder}
            />

            <div className="section-panel">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-copper">
                Why people use Testition
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Verified homes",
                    body: "See trust cues before you spend time on a property.",
                  },
                  {
                    icon: MapPinned,
                    title: "City-based search",
                    body: "Start from the city and locality you actually want.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Guided setup",
                    body: "Registration, onboarding, and payments stay connected.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div className="soft-panel" key={title}>
                    <Icon className="h-5 w-5 text-copper" />
                    <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/68">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {featuredRecommendation ? (
              <div className="section-panel">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-copper">
                      Recommended property
                    </p>
                    <h2 className="mt-3 font-serif text-3xl leading-tight text-ink">
                      {featuredRecommendation.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-pine">
                      {featuredRecommendation.locality}, {featuredRecommendation.city}
                    </p>
                  </div>
                  <span className="trust-badge">Match {featuredRecommendation.score}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-ink/68">
                  {featuredRecommendation.recommendationReason}
                </p>
                <div className="mt-5">
                  <Link className="button-primary" href={`/properties/${featuredRecommendation.listingId}`}>
                    View property
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <HomeAccountJourneySpotlight />

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="section-panel flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-copper">
              Explore cities
            </p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
              Browse the main launch cities, then move into search and property details with the
              same account and payment journey.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {cities.map((city) => (
              <Link className="button-secondary px-4 py-2 text-sm" href={`/cities/${city.toLowerCase()}`} key={city}>
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          body="These listing sections are kept simple so you can move quickly from discovery into registration, shortlist, and payment."
          eyebrow="Featured homes"
          title="Trending and newly listed homes"
        />

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="section-panel grid gap-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-pine">
                Trending now
              </p>
              <Clock3 className="h-4 w-4 text-copper" />
            </div>
            {home.trending.slice(0, 2).map((listing) => (
              <ListingCard key={listing.listingId} listing={listing} />
            ))}
          </div>

          <div className="section-panel grid gap-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-pine">
                Freshly listed
              </p>
              <BadgeCheck className="h-4 w-4 text-copper" />
            </div>
            {home.newListings.slice(0, 2).map((listing) => (
              <ListingCard key={listing.listingId} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
