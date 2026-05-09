"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Crown,
  Heart,
  Lock,
  MessageSquareMore,
  PhoneCall,
  Wallet
} from "lucide-react";
import { ExpressInterestModal } from "@/components/ui/express-interest-modal";
import { ScheduleVisitModal } from "@/components/ui/schedule-visit-modal";
import { AddToCompareButton } from "@/components/ui/add-to-compare-button";
import { ReportListingButton } from "@/components/ui/report-listing-button";
import { LeaveReviewButton } from "@/components/ui/leave-review-button";
import { startChatThread } from "@/lib/api/client";
import { ShortlistButton } from "@/components/ui/shortlist-button";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  activateTenantPremium,
  getPropertyDetail,
  getTenantPremiumAccess
} from "@/lib/api/client";
import type {
  PropertyDetailResponse,
  PropertyFaqResponse,
  PropertyReviewsResponse
} from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

interface PropertyDetailExperienceProps {
  propertyId: string;
  initialDetail: PropertyDetailResponse;
  reviews: PropertyReviewsResponse;
  faq: PropertyFaqResponse;
}

function formatMoney(amount: number) {
  return "Rs. " + amount.toLocaleString("en-IN");
}

export function PropertyDetailExperience({
  propertyId,
  initialDetail,
  reviews,
  faq
}: PropertyDetailExperienceProps) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const sessionRole = useAuthStore((state) => state.session?.role ?? null);
  const queryClient = useQueryClient();
  const router = useRouter();
  // Tier 1 #3 — Express Interest modal state
  const [expressInterestOpen, setExpressInterestOpen] = useState(false);
  const [interestSentMsg, setInterestSentMsg] = useState<string | null>(null);
  // Tier 2 #5 — Schedule Visit modal state
  const [scheduleVisitOpen, setScheduleVisitOpen] = useState(false);
  const [visitConfirmedMsg, setVisitConfirmedMsg] = useState<string | null>(null);
  // Tier 2 #6 — Chat (open-or-reuse thread, then redirect to /messages)
  const [chatOpening, setChatOpening] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleMessageOwner = async () => {
    setChatOpening(true);
    setChatError(null);
    try {
      const thread = await startChatThread(propertyId, accessToken);
      router.push(`/messages?thread=${encodeURIComponent(thread.threadId)}`);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Could not start chat. Please try again.");
    } finally {
      setChatOpening(false);
    }
  };

  const detailQuery = useQuery({
    queryKey: ["property-detail", propertyId, accessToken ?? "guest"],
    queryFn: () => getPropertyDetail(propertyId, accessToken),
    initialData: initialDetail,
    staleTime: 0
  });
  const { isFetching: isDetailFetching, refetch: refetchDetail } = detailQuery;

  const detail = detailQuery.data ?? initialDetail;
  const trustScoreCards = [
    detail.trustSignals.propertyTrustScore,
    detail.trustSignals.neighbourhoodSafetyScore,
    detail.trustSignals.priceFairnessScore
  ];
  const fullAccess = detail.viewerAccess.accessLevel === "FULL";
  const premiumRequired = detail.viewerAccess.premiumRequired;
  // Free-trial active = tenant gets FULL access without an active premium subscription.
  // Backend grants this for the first N unique property views (configured in feature_entitlements).
  const isFreeTrialActive =
    fullAccess &&
    detail.viewerAccess.viewerRole === "TENANT" &&
    !detail.viewerAccess.premiumActive;

  const premiumQuery = useQuery({
    queryKey: ["tenant-premium", accessToken ?? "guest"],
    queryFn: () => getTenantPremiumAccess(accessToken),
    enabled: Boolean(accessToken) && sessionRole === "TENANT" && premiumRequired
  });

  const activatePremium = useMutation({
    mutationFn: () => activateTenantPremium(accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tenant-premium", accessToken ?? "guest"] }),
        queryClient.invalidateQueries({ queryKey: ["property-detail", propertyId] }),
        queryClient.invalidateQueries({ queryKey: ["current-user-profile", accessToken ?? "guest"] })
      ]);
    }
  });

  const premiumSummary = premiumQuery.data;
  const hasUnlockedAccess =
    fullAccess || detail.viewerAccess.premiumActive || premiumSummary?.premiumActive === true;
  const isOwnerView = detail.viewerAccess.ownerView || sessionRole === "OWNER";
  const upgradePrice = detail.viewerAccess.upgradePrice ?? premiumSummary?.priceAmount ?? 500;
  const upgradeCurrency = detail.viewerAccess.upgradeCurrency ?? premiumSummary?.currency ?? "INR";
  const upgradePeriod = detail.viewerAccess.upgradePeriodLabel ?? "per year";
  const showUnlockButton =
    sessionRole === "TENANT" &&
    !hasUnlockedAccess &&
    premiumSummary?.canActivate &&
    !activatePremium.isPending;
  const requiresWalletTopup =
    sessionRole === "TENANT" &&
    !hasUnlockedAccess &&
    !premiumSummary?.premiumActive &&
    !premiumSummary?.canActivate &&
    (premiumSummary?.shortfallAmount ?? 0) > 0;

  useEffect(() => {
    if (
      accessToken &&
      sessionRole === "TENANT" &&
      premiumSummary?.premiumActive &&
      !fullAccess &&
      !isDetailFetching
    ) {
      void refetchDetail();
    }
  }, [
    accessToken,
    fullAccess,
    isDetailFetching,
    premiumSummary?.premiumActive,
    refetchDetail,
    sessionRole
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-14">
      {isFreeTrialActive ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              <strong>{detail.viewerAccess.headline}</strong>
              <span className="ml-2 text-amber-800/80">{detail.viewerAccess.message}</span>
            </p>
          </div>
          <Link className="button-primary text-xs" href="/wallet">
            Activate Premium
          </Link>
        </div>
      ) : null}
      <section className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="hero-panel px-6 py-8 md:px-10 md:py-10">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow-pill">Property detail</span>
              {premiumRequired ? (
                <span className="meta-pill">
                  <Crown className="mr-2 h-4 w-4 text-pine" />
                  {fullAccess ? "Premium unlocked" : "Premium listing view"}
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {detail.trustSignals.badges.map((badge) => (
                <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-oat/84" key={badge}>
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              {detail.property.title}
            </h1>
            <p className="mt-4 text-lg text-oat/86">{detail.property.subtitle}</p>
            <p className="mt-4 text-base leading-7 text-oat/72">
              {detail.property.locality}, {detail.property.city}
            </p>
            <p className="mt-2 text-sm text-oat/56">{detail.property.address}</p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-oat/76">
              {detail.property.description}
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] border border-white/12 bg-white/8 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-oat/56">Gallery preview</p>
              <div className="mt-5 grid min-h-[220px] gap-4 md:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-[28px] bg-gradient-to-br from-white/20 via-white/8 to-transparent p-5">
                  <p className="text-sm font-semibold text-oat">
                    {fullAccess ? "Primary room view" : "Preview image"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-oat/68">
                    {fullAccess
                      ? `${detail.property.imageUrls.length} images available in the property gallery.`
                      : "Premium tenants unlock the full gallery, detailed room views, and listing walkthrough content."}
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-[24px] bg-white/10 p-4 text-sm text-oat/74">
                    {detail.specs.furnishing}
                  </div>
                  <div className="rounded-[24px] bg-white/10 p-4 text-sm text-oat/74">
                    {detail.specs.areaSqFt} sq.ft
                  </div>
                  <div className="rounded-[24px] bg-white/10 p-4 text-sm text-oat/74">
                    {detail.specs.parking}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/12 bg-white/8 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-oat/56">
                {fullAccess ? "Trust snapshot" : "Access snapshot"}
              </p>
              <div className="mt-5 grid gap-4">
                <div>
                  <p className="text-3xl font-semibold text-oat">
                    {fullAccess ? detail.trustSignals.averageRating.toFixed(1) : formatMoney(upgradePrice)}
                  </p>
                  <p className="text-sm text-oat/68">
                    {fullAccess
                      ? `Rating across ${detail.trustSignals.ratingCount} signals`
                      : `${detail.viewerAccess.upgradePlanName ?? "Tenant Premium"} ${upgradePeriod}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-oat">
                    {fullAccess ? detail.trustSignals.ownerResponseTimeLabel : detail.viewerAccess.headline}
                  </p>
                  <p className="mt-1 text-sm text-oat/68">
                    {fullAccess
                      ? `${detail.ownerInfo.responseTimeCommitment} • ${detail.trustSignals.lastUpdatedLabel}`
                      : detail.viewerAccess.message}
                  </p>
                  {fullAccess ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-oat/58">
                      Response rate {detail.trustSignals.ownerResponseRate}%
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="section-panel lg:sticky lg:top-32 lg:self-start">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">Pricing snapshot</p>
          <p className="mt-4 text-4xl font-semibold text-ink">
            {formatMoney(detail.pricing.monthlyRent)}
          </p>
          <div className="surface-divider mt-5" />
          <div className="mt-5 grid gap-3 text-sm text-ink/72">
            <p>Deposit {formatMoney(detail.pricing.securityDeposit)}</p>
            <p>Maintenance {formatMoney(detail.pricing.maintenance)}</p>
            <p>Brokerage {formatMoney(detail.pricing.brokerage)}</p>
            <p>Available from {detail.pricing.availableFrom}</p>
          </div>
          <div className="mt-6 grid gap-3">
            <ShortlistButton propertyId={detail.property.propertyId} />
            {!isOwnerView ? (
              <div className="flex justify-end">
                <ReportListingButton propertyId={detail.property.propertyId} />
              </div>
            ) : null}
            {isOwnerView ? (
              <Link className="button-secondary" href="/owner/dashboard">
                <Building2 className="mr-2 h-4 w-4" />
                Owner dashboard
              </Link>
            ) : fullAccess && detail.ctaFlags.canScheduleVisit ? (
              <Link className="button-primary" href="/account/onboarding">
                <CalendarClock className="mr-2 h-4 w-4" />
                Schedule visit
              </Link>
            ) : hasUnlockedAccess ? (
              <button className="button-secondary" disabled type="button">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Premium access active
              </button>
            ) : (
              <Link className="button-primary" href={sessionRole === "TENANT" ? "/wallet" : "/tenant/login"}>
                <Crown className="mr-2 h-4 w-4" />
                {sessionRole === "TENANT" ? "Unlock premium access" : "Sign in as tenant"}
              </Link>
            )}
          </div>
          <div className="mt-6 grid gap-3">
            {fullAccess ? (
              <>
                <div className="soft-panel">
                  <p className="text-xs uppercase tracking-[0.2em] text-copper">Owner contact</p>
                  <p className="mt-2 text-sm text-ink/74">{detail.ownerInfo.phoneMasked}</p>
                </div>
                <div className="soft-panel">
                  <p className="text-xs uppercase tracking-[0.2em] text-copper">KYC stage</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{detail.ctaFlags.kycRequiredStage}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/72">{detail.ctaFlags.kycGuidance}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {detail.ctaFlags.canCallOwner ? (
                    <span className="meta-pill">
                      <PhoneCall className="mr-2 h-4 w-4 text-pine" />
                      Call enabled
                    </span>
                  ) : null}
                  {detail.ctaFlags.canChatOwner ? (
                    <span className="meta-pill">
                      <MessageSquareMore className="mr-2 h-4 w-4 text-pine" />
                      Chat enabled
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="soft-panel">
                <p className="text-xs uppercase tracking-[0.2em] text-copper">Premium tenant access</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {formatMoney(upgradePrice)} {upgradePeriod}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink/72">{detail.viewerAccess.message}</p>
                {premiumQuery.isLoading ? (
                  <p className="mt-3 text-sm text-ink/58">Checking your premium eligibility...</p>
                ) : null}
                {premiumQuery.isError ? (
                  <p className="mt-3 text-sm text-red-700">
                    We could not load your premium status right now. You can still open your wallet and try again.
                  </p>
                ) : null}
                {premiumSummary ? (
                  <div className="mt-4 rounded-2xl border border-black/6 bg-white/70 px-4 py-4 text-sm text-ink/74">
                    <p className="font-semibold text-ink">{premiumSummary.message}</p>
                    {premiumSummary.premiumActive ? (
                      <p className="mt-2">Refreshing full property access for this page.</p>
                    ) : (
                      <>
                        <p className="mt-2">Wallet balance: {premiumSummary.walletBalanceFormatted}</p>
                        {premiumSummary.shortfallAmount > 0 ? (
                          <p className="mt-1">
                            Shortfall: {formatMoney(premiumSummary.shortfallAmount)}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {!accessToken ? (
                    <>
                      <Link className="button-primary" href="/tenant/login">
                        Sign in as tenant
                      </Link>
                      <Link className="button-secondary" href="/account/register">
                        Register now
                      </Link>
                    </>
                  ) : null}

                  {showUnlockButton ? (
                    <button
                      className="button-primary"
                      disabled={activatePremium.isPending}
                      onClick={() => activatePremium.mutate()}
                      type="button"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      {activatePremium.isPending ? "Unlocking..." : "Unlock with wallet"}
                    </button>
                  ) : null}

                  {requiresWalletTopup ? (
                    <Link className="button-secondary" href="/wallet">
                      <Wallet className="mr-2 h-4 w-4" />
                      Top up wallet
                    </Link>
                  ) : null}
                </div>
                {activatePremium.data ? (
                  <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {activatePremium.data.message}
                  </p>
                ) : null}
                {activatePremium.error instanceof Error ? (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {activatePremium.error.message}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </aside>
      </section>

      {fullAccess ? (
        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-8">
            <div className="section-panel">
              <SectionHeading
                body="Pricing, layout specs, and amenity details are grouped to make decisions quicker on both desktop and mobile."
                eyebrow="Specs"
                title="A property overview that surfaces what matters first"
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="soft-panel">
                  <p className="text-sm text-ink/60">Home specs</p>
                  <p className="mt-2 text-base text-ink">
                    {detail.specs.bhk} • {detail.specs.furnishing} • {detail.specs.areaSqFt} sq.ft
                  </p>
                </div>
                <div className="soft-panel">
                  <p className="text-sm text-ink/60">Building snapshot</p>
                  <p className="mt-2 text-base text-ink">
                    Floor {detail.specs.floor}/{detail.specs.totalFloors} • {detail.specs.parking}
                  </p>
                </div>
                <div className="soft-panel">
                  <p className="text-sm text-ink/60">Facing and layout</p>
                  <p className="mt-2 text-base text-ink">
                    {detail.specs.facing} • {detail.specs.balconies} balconies • {detail.specs.bathrooms} bathrooms
                  </p>
                </div>
                <div className="soft-panel">
                  <p className="text-sm text-ink/60">Availability</p>
                  <p className="mt-2 text-base text-ink">{detail.property.availabilityStatus}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {detail.amenities.map((amenity) => (
                  <span className="rounded-full border border-black/6 bg-white/70 px-4 py-2 text-sm text-ink/76" key={amenity}>
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="section-panel">
              <SectionHeading
                body="The PRD trust signals are now shown as clear scorecards so tenants understand why a listing feels reliable before they commit to the next step."
                eyebrow="Trust scores"
                title="AI-assisted trust, safety, and price fairness signals"
              />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {trustScoreCards.map((scoreCard) => (
                  <article className="soft-panel" key={scoreCard.title}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                      {scoreCard.title}
                    </p>
                    <p className="mt-4 font-serif text-5xl text-ink">{scoreCard.score}/100</p>
                    <p className="mt-4 text-sm leading-6 text-ink/72">{scoreCard.summary}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/48">
                      {scoreCard.calculationStage}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="section-panel">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Tenant reviews
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    <p className="font-serif text-5xl text-ink">{reviews.ratingSummary.averageRating.toFixed(1)}</p>
                    <p className="pb-2 text-sm text-ink/65">{reviews.ratingSummary.totalReviews} reviews</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="meta-pill">
                    <BadgeCheck className="mr-2 h-4 w-4 text-pine" />
                    Verified trust layer
                  </span>
                  <LeaveReviewButton propertyId={propertyId} />
                </div>
              </div>
              <div className="mt-8 grid gap-4">
                {reviews.reviews.map((review) => (
                  <article className="soft-panel" key={review.reviewId}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{review.headline}</p>
                      {review.verifiedStay ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <BadgeCheck className="h-3 w-3" />
                          Verified stay
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-ink/68">{review.comment}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-copper">
                      {review.reviewerName} • {review.reviewerType} • {review.rating}/5
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8">
            <div className="section-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Owner details</p>
              <h3 className="mt-4 flex flex-wrap items-center gap-3 text-2xl font-semibold text-ink">
                <Building2 className="h-6 w-6 text-pine" />
                {detail.ownerInfo.name}
                {detail.ownerInfo.verifiedOwner ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    ✓ Verified Owner
                  </span>
                ) : null}
              </h3>
              <p className="mt-2 text-sm text-ink/68">{detail.ownerInfo.badge}</p>

              {/* Tier 1 #3 + Tier 2 #5 + Tier 2 #6 + Tier 2 #7 — tenant CTAs when full access is granted */}
              {sessionRole === "TENANT" && fullAccess ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setExpressInterestOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
                    >
                      <Heart className="h-4 w-4" />
                      Express Interest (Rs 49)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleVisitOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine/90"
                    >
                      <CalendarClock className="h-4 w-4" />
                      Schedule a visit
                    </button>
                    <button
                      type="button"
                      onClick={handleMessageOwner}
                      disabled={chatOpening}
                      className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-oat hover:bg-navy/90 disabled:opacity-60"
                    >
                      <MessageSquareMore className="h-4 w-4" />
                      {chatOpening ? "Opening chat…" : "Message owner"}
                    </button>
                    <AddToCompareButton listingId={propertyId} variant="primary" />
                  </div>
                  {chatError ? (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                      {chatError}
                    </p>
                  ) : null}
                </>
              ) : null}

              <div className="mt-6 grid gap-3">
                <div className="soft-panel">
                  <p className="text-sm text-ink/68">Contact</p>
                  <p className="mt-2 font-semibold text-ink">{detail.ownerInfo.phoneMasked}</p>
                </div>
                <div className="soft-panel">
                  <p className="text-sm text-ink/68">Response time</p>
                  <p className="mt-2 text-sm leading-7 text-ink/72">
                    {detail.ownerInfo.responseTimeCommitment}
                  </p>
                </div>
                <div className="soft-panel">
                  <p className="text-sm text-ink/68">Languages and tenure</p>
                  <p className="mt-2 text-sm leading-7 text-ink/72">
                    {detail.ownerInfo.preferredLanguage} • {detail.ownerInfo.yearsOnPlatform} years on platform
                  </p>
                </div>
              </div>
            </div>

            <div className="section-panel">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Frequently asked</p>
                <Link className="inline-flex items-center gap-2 text-sm font-semibold text-copper" href="/contact">
                  Need support
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="mt-6 grid gap-4">
                {faq.faqItems.map((item) => (
                  <div className="soft-panel" key={item.question}>
                    <p className="font-semibold text-ink">{item.question}</p>
                    <p className="mt-2 text-sm leading-7 text-ink/70">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="section-panel">
            <SectionHeading
              body="Standard tenants and guests can still preview the headline, rent, broad location, and a short amenity summary before deciding whether this home deserves a deeper look."
              eyebrow="Preview mode"
              title="A clean teaser view keeps discovery open without exposing the full listing"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="soft-panel">
                <p className="text-sm text-ink/60">Visible now</p>
                <p className="mt-2 text-base text-ink">
                  {detail.specs.bhk} • {detail.specs.furnishing} • {detail.specs.areaSqFt} sq.ft
                </p>
              </div>
              <div className="soft-panel">
                <p className="text-sm text-ink/60">Broad location</p>
                <p className="mt-2 text-base text-ink">
                  {detail.property.locality}, {detail.property.city}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {detail.amenities.map((amenity) => (
                <span className="rounded-full border border-black/6 bg-white/70 px-4 py-2 text-sm text-ink/76" key={amenity}>
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <div className="section-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">What premium unlocks</p>
            <div className="mt-6 grid gap-4">
              {[
                "Exact property address and complete photo gallery",
                "Owner identity panel, masked contact, and response commitment",
                "AI-assisted trust, neighbourhood safety, and price fairness scores",
                "Visit-ready details, KYC guidance, and richer FAQs before you shortlist harder"
              ].map((item) => (
                <div className="soft-panel flex items-start gap-3" key={item}>
                  <Lock className="mt-0.5 h-4 w-4 text-copper" />
                  <p className="text-sm leading-6 text-ink/72">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-black/6 bg-white/78 p-5">
              <p className="text-sm font-semibold text-ink">Business rule</p>
              <p className="mt-2 text-sm leading-6 text-ink/72">
                Open discovery keeps the funnel healthy, while premium access monetizes deeper owner and trust data only when a tenant is serious enough to pay for it.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Tier 1 #3 — Express Interest modal */}
      {expressInterestOpen ? (
        <ExpressInterestModal
          listingId={propertyId}
          listingTitle={detail.property.title}
          ownerName={detail.ownerInfo.name}
          onClose={() => setExpressInterestOpen(false)}
          onSent={(result) => {
            setExpressInterestOpen(false);
            setInterestSentMsg(
              `✅ Interest sent. Wallet balance: Rs ${result.walletBalance.toLocaleString("en-IN")}.`
            );
            queryClient.invalidateQueries({ queryKey: ["wallet-dashboard", accessToken ?? "guest"] });
          }}
        />
      ) : null}

      {/* Tier 2 #5 — Schedule Visit modal */}
      {scheduleVisitOpen ? (
        <ScheduleVisitModal
          listingId={propertyId}
          listingTitle={detail.property.title}
          listingLocality={detail.property.locality}
          listingCity={detail.property.city}
          onClose={() => setScheduleVisitOpen(false)}
          onScheduled={(visit) => {
            setScheduleVisitOpen(false);
            setVisitConfirmedMsg(
              `✅ Visit confirmed for ${visit.preferredDate} at ${visit.slotLabel}. The owner will see it in their dashboard.`
            );
            queryClient.invalidateQueries({ queryKey: ["tenant-visits", accessToken ?? "guest"] });
          }}
        />
      ) : null}

      {/* Toast — visit confirmed */}
      {visitConfirmedMsg ? (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm rounded-2xl border border-pine/30 bg-pine/8 px-5 py-4 text-sm text-pine shadow-soft">
          <p className="font-semibold">Visit booked!</p>
          <p className="mt-1 text-ink/72">{visitConfirmedMsg}</p>
          <button
            type="button"
            onClick={() => setVisitConfirmedMsg(null)}
            className="mt-3 text-xs font-semibold text-pine hover:text-navy"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Toast — appears after a successful Express Interest */}
      {interestSentMsg ? (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-soft">
          <p className="font-semibold">Lead sent!</p>
          <p className="mt-1 text-emerald-800/80">{interestSentMsg}</p>
          <button
            type="button"
            onClick={() => setInterestSentMsg(null)}
            className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </main>
  );
}
