export interface ListingSummary {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  rent: number;
  bhk: string;
  verified: boolean;
  premium: boolean;
  postedLabel: string;
  urgencyLabel?: string | null;
}

export interface RecommendationItem {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  rent: number;
  bhk: string;
  verified: boolean;
  premium: boolean;
  postedLabel: string;
  recommendationReason: string;
  score: number;
}

export interface HomeHeroSearchConfig {
  city: string;
  lat: number;
  lng: number;
  searchPlaceholder: string;
  mapEnabled: boolean;
  smartSuggestionsEnabled: boolean;
}

export interface HomeResponse {
  heroSearchConfig: HomeHeroSearchConfig;
  recommendations: RecommendationItem[];
  trending: ListingSummary[];
  newListings: ListingSummary[];
  premiumVerified: ListingSummary[];
  urgencyListings: ListingSummary[];
}

export interface ListingCollectionResponse {
  items: ListingSummary[];
  totalCount: number;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SearchAppliedFilters {
  query: string | null;
  city: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bhk: string | null;
  furnishing: string | null;
  tenantType: string | null;
  petFriendly: boolean | null;
  verified: boolean | null;
  sortBy: string;
}

export interface SearchSummary {
  summary: string;
  city: string;
  sortBy: string;
  resultCount: number;
}

export interface SearchResponse {
  items: ListingSummary[];
  pagination: PaginationResponse;
  appliedFilters: SearchAppliedFilters;
  summary: SearchSummary;
}

export interface SearchMapFiltersRequest {
  city?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  bhk?: string | null;
  furnishing?: string | null;
  tenantType?: string | null;
  petFriendly?: boolean | null;
  verified?: boolean | null;
}

export interface SearchMapRequest {
  northEastLat: number;
  northEastLng: number;
  southWestLat: number;
  southWestLng: number;
  filters?: SearchMapFiltersRequest;
}

export interface SearchMapPin {
  listingId: string;
  title: string;
  locality: string;
  lat: number;
  lng: number;
  rent: number;
  verified: boolean;
}

export interface SearchMapCluster {
  clusterId: string;
  lat: number;
  lng: number;
  count: number;
  label: string;
}

export interface SearchMapResponse {
  pins: SearchMapPin[];
  count: number;
  clusters: SearchMapCluster[];
}

export interface FilterMetadataResponse {
  budgetRanges: string[];
  bhkOptions: string[];
  furnishingOptions: string[];
  tenantTypes: string[];
  quickFilters: string[];
}

export interface PropertyDetailResponse {
  property: {
    propertyId: string;
    title: string;
    subtitle: string;
    locality: string;
    city: string;
    address: string;
    description: string;
    availabilityStatus: string;
    imageUrls: string[];
  };
  pricing: {
    monthlyRent: number;
    securityDeposit: number;
    maintenance: number;
    brokerage: number;
    availableFrom: string;
  };
  specs: {
    bhk: string;
    bathrooms: number;
    balconies: number;
    areaSqFt: number;
    furnishing: string;
    floor: number;
    totalFloors: number;
    facing: string;
    parking: string;
  };
  amenities: string[];
  trustSignals: {
    verified: boolean;
    verificationLabel: string;
    ownerResponseRate: number;
    ownerResponseTimeLabel: string;
    averageRating: number;
    ratingCount: number;
    lastUpdatedLabel: string;
    propertyTrustScore: {
      title: string;
      score: number;
      summary: string;
      calculationStage: string;
    };
    neighbourhoodSafetyScore: {
      title: string;
      score: number;
      summary: string;
      calculationStage: string;
    };
    priceFairnessScore: {
      title: string;
      score: number;
      summary: string;
      calculationStage: string;
    };
    badges: string[];
  };
  ownerInfo: {
    ownerId: string;
    name: string;
    phoneMasked: string;
    responseTimeCommitment: string;
    preferredLanguage: string;
    badge: string;
    yearsOnPlatform: number;
  };
  ctaFlags: {
    canScheduleVisit: boolean;
    canCallOwner: boolean;
    canChatOwner: boolean;
    canSave: boolean;
    canStartKyc: boolean;
    kycRequiredStage: string;
    kycGuidance: string;
  };
  viewerAccess: {
    accessLevel: string;
    viewerRole: string;
    premiumRequired: boolean;
    premiumActive: boolean;
    ownerView: boolean;
    headline: string;
    message: string;
    upgradePlanCode: string | null;
    upgradePlanName: string | null;
    upgradePrice: number | null;
    upgradeCurrency: string | null;
    upgradePeriodLabel: string | null;
  };
}

export interface PropertyReview {
  reviewId: string;
  reviewerName: string;
  rating: number;
  headline: string;
  comment: string;
  reviewerType: string;
  createdAt: string;
}

export interface PropertyReviewsResponse {
  reviews: PropertyReview[];
  ratingSummary: {
    averageRating: number;
    totalReviews: number;
    fiveStarCount: number;
    fourStarCount: number;
    threeStarCount: number;
    twoStarCount: number;
    oneStarCount: number;
  };
  totalCount: number;
}

export interface PropertyFaqResponse {
  faqItems: Array<{
    question: string;
    answer: string;
  }>;
}

export interface SavePropertyResponse {
  saved: boolean;
  savedAt: string;
}

export interface RemovePropertyResponse {
  removed: boolean;
  removedAt: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: string;
  role: string;
  authMethod: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean | null;
  message: string;
  phase: number;
}

export interface AuthFlowResponse {
  flowId: string;
  status: string;
  nextStep: string;
  message: string;
  channel: string;
  maskedDestination: string;
  phase: number;
}

export interface UserProfileResponse {
  userId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  profileStatus: string;
  city: string;
  dateOfBirth: string | null;
  gender: string | null;
  occupation: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  employmentType: string | null;
  employerName: string | null;
  monthlyIncomeRange: string | null;
  previousLandlordName: string | null;
  previousLandlordPhone: string | null;
  aadhaarLast4: string | null;
  panCardNumber: string | null;
  governmentIdType: string | null;
  governmentIdPhotoUrl: string | null;
  upiId: string | null;
  photoUrl: string | null;
  profileCompletion: number;
  premiumTenant: boolean;
  premiumPlanCode: string | null;
  premiumExpiresAt: string | null;
  hasPassword: boolean;
}

export interface UserProfileUpdateResponse {
  updated: boolean;
  user: UserProfileResponse;
}

export interface UserPreferenceProfileResponse {
  preferenceProfileId: string;
  budgetMin: number;
  budgetMax: number;
  bhkPreference: string;
  furnishingPreference: string | null;
  preferredLocalities: string[];
  commuteLocation: string;
  moveInDate: string | null;
  lifestyleTags: string[];
  petFriendly: boolean;
  tenantType: string;
}

export interface UserPreferenceUpdateResponse {
  updated: boolean;
  preferenceProfileId: string;
}

export interface UserVerificationStatusResponse {
  userId: string;
  profileStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: string;
  kycRequiredStage: string;
  kycGuidance: string;
  profileCompletion: number;
  photoUploaded: boolean;
  lastUpdatedAt: string;
}

export interface UserPhotoUploadResponse {
  uploaded: boolean;
  photoUrl: string;
  user: UserProfileResponse;
}

export interface UserPasswordUpdateResponse {
  updated: boolean;
  userId: string;
  hasPassword: boolean;
  message: string;
  updatedAt: string;
}

export interface UserAccountDeactivationResponse {
  deactivated: boolean;
  userId: string;
  profileStatus: string;
  message: string;
  deactivatedAt: string;
}

export interface AlertsSummaryResponse {
  unreadCount: number;
  urgentCount: number;
  summary: string;
}

export interface TenantDashboardResponse {
  savedCount: number;
  scheduledVisits: number;
  recommendedCount: number;
  profileCompletion: number;
  alertsSummary: AlertsSummaryResponse;
}

export interface MatchItemResponse {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  rent: number;
  bhk: string;
  verified: boolean;
  premium: boolean;
  postedLabel: string;
  matchScore: number;
  matchReason: string;
}

export interface MatchesResponse {
  items: MatchItemResponse[];
  pagination: PaginationResponse;
}

export interface VisitPropertySummaryResponse {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  imageUrl: string;
}

export interface VisitItemResponse {
  visitId: string;
  status: string;
  scheduledAt: string;
  preferredDate: string;
  slotId: string;
  slotLabel: string;
  notes: string | null;
  propertySummary: VisitPropertySummaryResponse;
}

export interface VisitsResponse {
  items: VisitItemResponse[];
  pagination: PaginationResponse;
}

export interface OwnerListingItemResponse {
  listingId: string;
  title: string;
  propertyType: string;
  city: string;
  locality: string;
  rent: number;
  deposit: number;
  bhk: string;
  furnishing: string;
  amenities: string[];
  photos: string[];
  availabilityDate: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
}

export interface OwnerListingsResponse {
  items: OwnerListingItemResponse[];
  pagination: PaginationResponse;
}

export interface OwnerCreatePaymentRecordRequest {
  tenantEmail: string;
  listingId: string;
  amount: number;
  paymentKind: string;
  paymentLabel: string;
  dueDate?: string;
  description?: string;
}

export interface OwnerCreatePaymentRecordResponse {
  paymentId: string;
  tenantUserId: string;
  tenantName: string;
  listingId: string;
  amount: number;
  currency: string;
  paymentKind: string;
  status: string;
  dueDate: string;
  message: string;
}

export interface OwnerGetStartedResponse {
  session: AuthSessionResponse;
  listing: {
    listingId: string;
    status: string;
    createdAt: string;
  };
  dashboardHref: string;
  message: string;
}

export interface PaymentGatewaySummaryResponse {
  providerMode: string;
  providerLabel: string;
  publicKeyAvailable: boolean;
  checkoutScriptUrl: string | null;
  guidance: string;
}

export interface TenantPaymentItemResponse {
  paymentId: string;
  listingId: string;
  listingTitle: string;
  locality: string;
  city: string;
  paymentLabel: string;
  paymentKind: string;
  status: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  ownerName: string;
}

export interface TenantPaymentOverviewResponse {
  pendingCount: number;
  pendingAmount: number;
  capturedAmount: number;
  upcomingDues: TenantPaymentItemResponse[];
}

export interface OwnerPaymentOverviewResponse {
  collectedThisMonth: number;
  pendingAmount: number;
  collectedCount: number;
  listingsCovered: number;
}

export interface PaymentHistoryItemResponse {
  paymentId: string;
  listingId: string;
  listingTitle: string;
  counterpartyName: string;
  paymentLabel: string;
  paymentKind: string;
  providerMode: string;
  status: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
}

export interface PaymentDashboardResponse {
  userId: string;
  role: string;
  actorName: string;
  gateway: PaymentGatewaySummaryResponse;
  tenantOverview: TenantPaymentOverviewResponse | null;
  ownerOverview: OwnerPaymentOverviewResponse | null;
  history: PaymentHistoryItemResponse[];
}

export interface PaymentCheckoutResponse {
  paymentId: string;
  providerMode: string;
  providerLabel: string;
  orderId: string;
  keyId: string | null;
  /** Stripe client secret for frontend confirmation (STRIPE mode only) */
  clientSecret: string | null;
  merchantName: string;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  customerContact: string | null;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  status: string;
  message: string;
  paidAt: string | null;
}

export interface LogoutResponse {
  signedOut: boolean;
  revokedSessionCount: number;
  message: string;
  signedOutAt: string;
}

export interface WebContentSectionResponse {
  heading: string;
  body: string;
  bullets: string[];
}

export interface WebContentPageResponse {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  pageType: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  updatedAt: string;
  sections: WebContentSectionResponse[];
}

export interface SupportEnquiryRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  city?: string;
  message: string;
}

export interface SupportEnquiryResponse {
  enquiryId: string;
  status: string;
  message: string;
  createdAt: string;
}

/* ─── Wallet ─────────────────────────────────────────────────────────────── */

export interface WalletTransactionItem {
  txnId: string;
  txnType: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  completedAt: string | null;
}

export interface WalletDashboardResponse {
  walletId: string;
  userId: string;
  ownerName: string;
  balance: number;
  currency: string;
  balanceFormatted: string;
  providerMode: string;
  stripeConfigured: boolean;
  transactions: WalletTransactionItem[];
}

export interface WalletTopupRequest {
  amount: number;
  currency: string;
}

export interface WalletTopupCheckoutResponse {
  txnId: string;
  paymentIntentId: string;
  clientSecret: string | null;
  publishableKey: string | null;
  amount: number;
  currency: string;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  providerMode: string;
}

export interface WalletTopupVerifyRequest {
  txnId: string;
  paymentIntentId: string;
}

export interface WalletTopupVerifyResponse {
  success: boolean;
  newBalance: number;
  currency: string;
  amountCredited: number;
  message: string;
  completedAt: string;
}

export interface TenantPremiumAccessResponse {
  planCode: string;
  planName: string;
  description: string;
  priceAmount: number;
  currency: string;
  billingPeriod: string;
  validityDays: number;
  premiumActive: boolean;
  subscriptionStatus: string;
  activeFrom: string | null;
  activeUntil: string | null;
  walletBalance: number;
  walletBalanceFormatted: string;
  canActivate: boolean;
  shortfallAmount: number;
  message: string;
}

export interface TenantPremiumActivationResponse {
  premiumActive: boolean;
  subscriptionId: string;
  planCode: string;
  subscriptionStatus: string;
  activeFrom: string;
  activeUntil: string;
  walletBalance: number;
  message: string;
}
