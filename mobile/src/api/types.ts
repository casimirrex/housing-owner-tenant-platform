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

export interface JourneyPhase {
  label: string;
  detail: string;
}

export interface SiteOverviewResponse {
  eyebrow: string;
  title: string;
  description: string;
  launchCities: string[];
  journeyPhases: JourneyPhase[];
  shippingNotes: string[];
}

export interface ProductPageCatalogItem {
  page: string;
  purpose: string;
  source: string;
}

export interface ProductPageCatalogResponse {
  pages: ProductPageCatalogItem[];
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

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: string;
  authMethod: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean | null;
  message: string;
  phase: number;
}

export interface HomeResponse {
  heroSearchConfig: {
    city: string;
    lat: number;
    lng: number;
    searchPlaceholder: string;
    mapEnabled: boolean;
    smartSuggestionsEnabled: boolean;
  };
  recommendations: Array<
    ListingSummary & {
      recommendationReason: string;
      score: number;
    }
  >;
  trending: ListingSummary[];
  newListings: ListingSummary[];
  premiumVerified: ListingSummary[];
  urgencyListings: ListingSummary[];
}

export interface SearchResponse {
  items: ListingSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  appliedFilters: {
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
  };
  summary: {
    summary: string;
    city: string;
    sortBy: string;
    resultCount: number;
  };
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
    averageRating: number;
    ratingCount: number;
    lastUpdatedLabel: string;
    badges: string[];
  };
  ownerInfo: {
    ownerId: string;
    name: string;
    phoneMasked: string;
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
  };
}

export interface PropertyReviewsResponse {
  reviews: Array<{
    reviewId: string;
    reviewerName: string;
    rating: number;
    headline: string;
    comment: string;
    reviewerType: string;
    createdAt: string;
  }>;
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

export interface MatchResponse {
  items: Array<
    ListingSummary & {
      matchScore: number;
      matchReason: string;
    }
  >;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface TenantDashboardResponse {
  savedCount: number;
  scheduledVisits: number;
  recommendedCount: number;
  profileCompletion: number;
  alertsSummary: {
    unreadCount: number;
    urgentCount: number;
    latestSummary: string;
  };
}

export interface UserProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  profileStatus: string;
  city: string;
  gender: string;
  occupation: string;
  photoUrl: string;
}

export interface UserPreferenceProfileResponse {
  preferenceProfileId: string;
  budgetMin: number;
  budgetMax: number;
  bhkPreference: string;
  preferredLocalities: string[];
  commuteLocation: string;
  lifestyleTags: string[];
  petFriendly: boolean;
  tenantType: string;
}

export interface VisitListResponse {
  items: Array<{
    visitId: string;
    status: string;
    scheduledAt: string;
    preferredDate: string;
    slotId: string;
    slotLabel: string;
    notes: string;
    propertySummary: {
      propertyId: string;
      title: string;
      locality: string;
      city: string;
      imageUrl: string;
    };
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface VisitSlotsResponse {
  slots: Array<{
    slotId: string;
    label: string;
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
  timeZone: string;
  visitRules: string[];
}

export interface VisitScheduleRequest {
  propertyId: string;
  slotId: string;
  preferredDate: string;
  notes?: string;
}

export interface VisitScheduleResponse {
  visitId: string;
  status: string;
  scheduledAt: string;
  propertySummary: {
    propertyId: string;
    title: string;
    locality: string;
    city: string;
    imageUrl: string;
  };
}

export interface PropertySaveResponse {
  saved: boolean;
  savedAt: string;
}

export interface PropertyRemoveSaveResponse {
  removed: boolean;
  removedAt: string;
}
