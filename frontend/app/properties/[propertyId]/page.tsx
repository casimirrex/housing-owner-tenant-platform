import type { Metadata } from "next";
import { PropertyDetailExperience } from "@/components/sections/property-detail-experience";
import { getPropertyDetail, getPropertyFaq, getPropertyReviews } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://testition.tech";

export async function generateMetadata(
  { params }: { params: { propertyId: string } }
): Promise<Metadata> {
  try {
    const detail = await getPropertyDetail(params.propertyId);
    const { property, pricing, specs, trustSignals } = detail;
    const title = `${property.title} · ₹${pricing.monthlyRent.toLocaleString("en-IN")}/mo · ${property.locality}, ${property.city}`;
    const description =
      `${specs.bhk} ${specs.furnishing} home in ${property.locality}, ${property.city}. ` +
      `${pricing.monthlyRent.toLocaleString("en-IN")} per month, ${specs.areaSqFt} sq ft.` +
      (trustSignals.verified ? " Verified listing on Testition." : "");
    const url = `${SITE_URL}/properties/${params.propertyId}`;
    const ogImage = property.imageUrls?.[0];

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        title,
        description,
        url,
        images: ogImage ? [{ url: ogImage }] : undefined
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary",
        title,
        description,
        images: ogImage ? [ogImage] : undefined
      }
    };
  } catch {
    return {
      title: "Property",
      description: "Find verified rentals on Testition."
    };
  }
}

export default async function PropertyPage({ params }: { params: { propertyId: string } }) {
  const [detail, reviews, faq] = await Promise.all([
    getPropertyDetail(params.propertyId),
    getPropertyReviews(params.propertyId),
    getPropertyFaq(params.propertyId)
  ]);

  // schema.org structured data — helps Google show rich previews.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: detail.property.title,
    description: detail.property.description,
    url: `${SITE_URL}/properties/${params.propertyId}`,
    image: detail.property.imageUrls,
    address: {
      "@type": "PostalAddress",
      streetAddress: detail.property.address,
      addressLocality: detail.property.locality,
      addressRegion: detail.property.city,
      addressCountry: "IN"
    },
    numberOfRooms: detail.specs.bhk,
    floorSize: {
      "@type": "QuantitativeValue",
      value: detail.specs.areaSqFt,
      unitCode: "FTK"
    },
    offers: {
      "@type": "Offer",
      price: detail.pricing.monthlyRent,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock"
    },
    aggregateRating:
      detail.trustSignals.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: detail.trustSignals.averageRating,
            reviewCount: detail.trustSignals.ratingCount
          }
        : undefined
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailExperience
        propertyId={params.propertyId}
        initialDetail={detail}
        reviews={reviews}
        faq={faq}
      />
    </>
  );
}
