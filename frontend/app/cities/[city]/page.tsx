import Link from "next/link";
import { ArrowRight, MapPinned, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/ui/listing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getNewListings, getTrending } from "@/lib/api/client";

const supportedCities: Record<string, string> = {
  bengaluru: "Bengaluru",
  pune: "Pune",
  hyderabad: "Hyderabad",
  "ncr-delhi": "NCR-Delhi",
  chennai: "Chennai"
};

const cityDescriptions: Record<string, string> = {
  Bengaluru:
    "Tech corridors, commute-led search, and verified homes around major employment zones.",
  Pune: "A calmer mix of student, family, and working professional rental demand.",
  Hyderabad: "Fast-growing micro-markets with strong gated-community and commuter appeal.",
  "NCR-Delhi": "Wide-market discovery that needs locality context and transparent trust signals.",
  Chennai: "Neighborhood-first discovery shaped by commute, family fit, and practical filtering."
};

export const dynamic = "force-dynamic";

export default async function CityPage({ params }: { params: { city: string } }) {
  const resolvedCity = supportedCities[params.city];

  if (!resolvedCity) {
    notFound();
  }

  const [trending, newListings] = await Promise.all([
    getTrending(resolvedCity, 0, 6),
    getNewListings(resolvedCity, 0, 6)
  ]);

  const localities = [...new Set([...trending.items, ...newListings.items].map((item) => item.locality))].slice(
    0,
    6
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.14fr_0.86fr] lg:items-end">
          <div className="relative z-10">
            <span className="eyebrow-pill">City landing</span>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              {resolvedCity} rentals with locality-led discovery and trust-first inventory.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/78 md:text-lg">
              {cityDescriptions[resolvedCity]}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-accent" href={`/search?city=${resolvedCity}`}>
                Open city search
              </Link>
              <Link className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine" href="/">
                Back to home
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            <div className="dark-panel">
              <p className="text-xs uppercase tracking-[0.22em] text-oat/54">Popular localities</p>
              <p className="mt-3 font-serif text-4xl text-oat">{localities.length}</p>
            </div>
            <div className="section-panel">
              <p className="text-xs uppercase tracking-[0.22em] text-copper">Trending</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{trending.totalCount}</p>
            </div>
            <div className="section-panel">
              <p className="text-xs uppercase tracking-[0.22em] text-copper">New listings</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{newListings.totalCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading
          body={`SEO-ready city landing page for ${resolvedCity}, designed around locally relevant discovery blocks and high-intent search entry points.`}
          eyebrow="Locality discovery"
          title={`Popular localities shaping ${resolvedCity} search intent`}
        />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {localities.map((locality) => (
          <div className="section-panel" key={locality}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-copper">Popular locality</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{locality}</p>
              </div>
              <MapPinned className="h-5 w-5 text-pine" />
            </div>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              Use this locality as a seed for city-level search, SEO modules, and commute-aware
              discovery.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-copper"
              href={`/search?city=${resolvedCity}&query=${encodeURIComponent(locality)}`}
            >
              Search this locality
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div className="section-panel grid gap-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pine">
              Trending homes
            </p>
            <Sparkles className="h-4 w-4 text-copper" />
          </div>
          {trending.items.map((listing) => (
            <ListingCard cityHref={`/search?city=${resolvedCity}`} key={listing.listingId} listing={listing} />
          ))}
        </div>
        <div className="section-panel grid gap-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pine">
              New in market
            </p>
            <ArrowRight className="h-4 w-4 text-copper" />
          </div>
          {newListings.items.map((listing) => (
            <ListingCard cityHref={`/search?city=${resolvedCity}`} key={listing.listingId} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
