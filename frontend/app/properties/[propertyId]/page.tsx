import { PropertyDetailExperience } from "@/components/sections/property-detail-experience";
import { getPropertyDetail, getPropertyFaq, getPropertyReviews } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: { propertyId: string } }) {
  const [detail, reviews, faq] = await Promise.all([
    getPropertyDetail(params.propertyId),
    getPropertyReviews(params.propertyId),
    getPropertyFaq(params.propertyId)
  ]);

  return (
    <PropertyDetailExperience
      propertyId={params.propertyId}
      initialDetail={detail}
      reviews={reviews}
      faq={faq}
    />
  );
}
