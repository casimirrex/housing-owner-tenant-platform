export interface ListingSummary {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  rent: number;
  bhk: string;
  verified: boolean;
  premium: boolean;
  /** Currently being paid-promoted to top of search (Bug F2: Featured Listings) */
  featured?: boolean;
  postedLabel: string;
  urgencyLabel?: string | null;
}

export interface ListingPromotionResponse {
  listingId: string;
  featuredUntil: string;
  durationDays: number;
  amountPaid: number;
  currency: string;
  walletBalance: number;
  message: string;
}

export interface OwnerVerificationResponse {
  verified: boolean;
  verifiedAt: string | null;
  amountPaid: number;
  currency: string;
  walletBalance: number;
  message: string;
}

export interface LeadContactResponse {
  leadId: string;
  listingId: string;
  amountPaid: number;
  currency: string;
  walletBalance: number;
  createdAt: string;
  message: string;
}

export interface OwnerLeadsResponse {
  leads: Array<{
    leadId: string;
    listingId: string;
    listingTitle: string;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string | null;
    message: string | null;
    status: "NEW" | "VIEWED" | "RESPONDED" | "ARCHIVED";
    amountPaid: number;
    createdAt: string;
  }>;
  newCount: number;
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

export interface NearbyListing {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  rent: number;
  bhk: string;
  verified: boolean;
  premium: boolean;
  featured: boolean;
  postedLabel: string;
  urgencyLabel: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

export interface NearbyCenterPoint {
  lat: number;
  lng: number;
}

export interface NearbyResponse {
  items: NearbyListing[];
  centerPoint: NearbyCenterPoint;
  radiusKm: number;
}

export type ListingReportReason =
  | "FAKE_LISTING"
  | "WRONG_INFORMATION"
  | "SPAM"
  | "SCAM_OR_FRAUD"
  | "OFFENSIVE_CONTENT"
  | "ALREADY_RENTED"
  | "DUPLICATE"
  | "OTHER";

export interface ListingReportRequestBody {
  reason: ListingReportReason;
  details?: string;
}

export interface ListingReportResponse {
  reportId: string;
  listingId: string;
  reason: ListingReportReason;
  status: string;
  createdAt: string;
}

export type ReviewEligibilityReason =
  | "OK"
  | "NEEDS_VISIT"
  | "VISIT_NOT_COMPLETED"
  | "ALREADY_REVIEWED"
  | "NOT_AUTHENTICATED";

export interface ReviewEligibilityResponse {
  eligible: boolean;
  reason: ReviewEligibilityReason;
  message: string;
}

export interface ReviewSubmitRequestBody {
  rating: number;
  headline: string;
  comment: string;
}

export interface ReviewSubmittedResponse {
  reviewId: string;
  listingId: string;
  visitId: string;
  rating: number;
  verifiedStay: boolean;
}

export interface UserBlockRequestBody {
  userId: string;
  reason?: string;
}

export interface UserBlock {
  blockerUserId: string;
  blockedUserId: string;
  reason: string | null;
  createdAt: string;
}

export interface UserBlockListResponse {
  items: UserBlock[];
  totalCount: number;
}

/* ── Tier 1: Admin dashboard ───────────────────────────────────────── */

export interface AdminStatsResponse {
  totalUsers: number;
  totalOwners: number;
  totalTenants: number;
  totalListings: number;
  publishedListings: number;
  flaggedListings: number;
  openReports: number;
  recentVisits: number;
  recentChats: number;
}

export interface AdminUserItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  city: string;
  profileStatus: string;
  verifiedOwner: boolean;
  blocked: boolean;
  updatedAt: string;
}

export interface AdminUsersResponse {
  items: AdminUserItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminListingItem {
  listingId: string;
  title: string;
  locality: string;
  city: string;
  ownerId: string;
  ownerName: string;
  status: string;
  rent: number;
  verified: boolean;
  featured: boolean;
  fraudScore: number;
  openReports: number;
  updatedAt: string;
}

export interface AdminListingsResponse {
  items: AdminListingItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminReportItem {
  reportId: string;
  listingId: string;
  listingTitle: string;
  reporterUserId: string;
  reporterName: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  resolutionNote: string | null;
}

export interface AdminReportsResponse {
  items: AdminReportItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type AdminReportAction = "IN_REVIEW" | "RESOLVED" | "DISMISSED";
export type AdminListingStatus =
  | "PUBLISHED"
  | "DRAFT"
  | "PAUSED"
  | "ARCHIVED"
  | "SUSPENDED";

/* ── Tier 2: maintenance, templates, roommates, chat images ───────────── */

export type MaintenanceCategory =
  | "PLUMBING" | "ELECTRICAL" | "APPLIANCE" | "PAINTING"
  | "PEST_CONTROL" | "CLEANING" | "CARPENTRY" | "OTHER";

export type MaintenancePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type MaintenanceStatus =
  | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";

export interface MaintenanceRequestCreateBody {
  listingId: string;
  category: MaintenanceCategory;
  priority?: MaintenancePriority;
  title: string;
  description: string;
}

export interface MaintenanceRequestItem {
  requestId: string;
  listingId: string;
  listingTitle: string;
  tenantId: string;
  tenantName: string;
  ownerId: string;
  ownerName: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  ownerNote: string | null;
}

export interface MaintenanceListResponse {
  items: MaintenanceRequestItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface MaintenanceUpdateStatusBody {
  status: MaintenanceStatus;
  ownerNote?: string;
}

export interface ListingTemplateCreateBody {
  name: string;
  payloadJson: string;
}

export interface ListingTemplateItem {
  templateId: string;
  ownerId: string;
  name: string;
  payloadJson: string;
  createdAt: string;
}

export interface ListingTemplateListResponse {
  items: ListingTemplateItem[];
  totalCount: number;
}

export interface RoommateProfileRequestBody {
  city: string;
  preferredAreas?: string;
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  genderPreference?: "ANY" | "MALE" | "FEMALE" | "NON_BINARY";
  occupation?: string;
  smoker: boolean;
  drinks: boolean;
  petFriendly: boolean;
  vegetarian: boolean;
  earlyRiser: boolean;
  bio?: string;
}

export interface RoommateProfile {
  profileId: string;
  userId: string;
  fullName: string;
  city: string;
  preferredAreas: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  genderPreference: string;
  occupation: string | null;
  smoker: boolean;
  drinks: boolean;
  petFriendly: boolean;
  vegetarian: boolean;
  earlyRiser: boolean;
  bio: string | null;
  active: boolean;
  matchScore: number | null;
}

export interface RoommateMatchesResponse {
  items: RoommateProfile[];
  totalCount: number;
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
    /** Tier 1 #2 — Verified Owner Badge */
    verifiedOwner?: boolean;
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
  /** Tier 0 trust & safety: review came from a user with a COMPLETED visit. */
  verifiedStay?: boolean;
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
  /** Bug F multi-role: every role this user is entitled to (TENANT, OWNER, or both). */
  availableRoles?: string[];
  authMethod: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean | null;
  message: string;
  phase: number;
}

export interface UserRolesResponse {
  availableRoles: string[];
  activeRole: string;
}

export interface OwnerAnalyticsResponse {
  totals: {
    totalViews: number;
    totalSaves: number;
    totalListings: number;
    publishedListings: number;
    viewsLast7Days: number;
  };
  perListing: Array<{
    listingId: string;
    title: string;
    city: string;
    locality: string;
    status: string;
    rent: number;
    views: number;
    saves: number;
    viewsLast7Days: number;
  }>;
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

/* ── Tier 3: Unified notifications ───────────────────────────────────── */

export type NotificationType =
  | "SAVED_SEARCH"
  | "MAINTENANCE_UPDATE"
  | "LEAD_REQUEST"
  | "VISIT_UPDATE"
  | "OWNER_REVIEW"
  | "LISTING_REPORT";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
  priority: "LOW" | "NORMAL" | "HIGH";
}

export interface NotificationsResponse {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
}

/* ── Tier 3: Tenant lease tracker ────────────────────────────────────── */

export type LeaseStatus = "ACTIVE" | "ENDED" | "TERMINATED";

export interface LeaseCreateBody {
  listingId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  documentUrl?: string;
  notes?: string;
}

export interface LeaseItem {
  leaseId: string;
  tenantId: string;
  tenantName: string;
  listingId: string;
  listingTitle: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  documentUrl: string | null;
  status: LeaseStatus;
  notes: string | null;
  daysUntilEnd: number;
  createdAt: string;
}

export interface LeaseListResponse {
  items: LeaseItem[];
  totalCount: number;
  expiringSoonCount: number;
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

export interface VisitSlot {
  slotId: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface VisitSlotsResponse {
  slots: VisitSlot[];
  timeZone: string;
  visitRules: string[];
}

export interface VisitScheduleResponse {
  visitId: string;
  status: string;
  scheduledAt: string;
  propertySummary: VisitPropertySummaryResponse;
}

export interface SavedSearchRequestBody {
  name: string;
  city?: string;
  query?: string;
  bhk?: string[];
  furnishing?: string;
  verified?: boolean;
  rentMin?: number;
  rentMax?: number;
  notificationEmail?: string;
}

export interface SavedSearchResponse {
  searchId: string;
  name: string;
  city: string | null;
  query: string | null;
  bhk: string[] | null;
  furnishing: string | null;
  verified: boolean | null;
  rentMin: number | null;
  rentMax: number | null;
  notificationEmail: string | null;
  active: boolean;
  createdAt: string;
  unreadAlerts: number;
  totalAlerts: number;
}

export interface ChatThreadResponse {
  threadId: string;
  listingId: string;
  listingTitle: string;
  listingLocality: string;
  listingCity: string;
  counterpartyId: string;
  counterpartyName: string;
  myRole: "TENANT" | "OWNER";
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  fromMe: boolean;
  content: string;
  sentAt: string;
  read: boolean;
  /** Tier 2: optional image attachment URL */
  imageUrl?: string | null;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
}

export interface SavedSearchAlertsResponse {
  alerts: Array<{
    alertId: string;
    searchId: string;
    searchName: string;
    listingId: string;
    listingTitle: string;
    listingLocality: string;
    listingCity: string;
    listingRent: number;
    listingBhk: string;
    status: "NEW" | "READ" | "DISMISSED";
    createdAt: string;
  }>;
  unreadCount: number;
}

export interface OwnerVisitsResponse {
  visits: Array<{
    visitId: string;
    listingId: string;
    listingTitle: string;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string | null;
    slotId: string;
    slotLabel: string;
    preferredDate: string;
    notes: string | null;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    scheduledAt: string;
  }>;
  upcomingCount: number;
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

/* ─── Trust Bundle ──────────────────────────────────────────────────────── */

export type RentabilityBand = "NEW" | "POOR" | "FAIR" | "GOOD" | "EXCELLENT";

export interface RentabilitySignal {
  label: string;
  contribution: number;
  detail: string | null;
}

export interface RentabilityScoreResponse {
  userId: string;
  score: number;
  scoreBand: RentabilityBand;
  displayName: string;
  signals: RentabilitySignal[];
  computedAt: string;
  nextRecomputeAt: string | null;
}

export type RentalAgreementStatus =
  | "DRAFT"
  | "AWAITING_SIGNATURES"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED";

export interface RentalAgreementCreateBody {
  propertyId: string;
  tenantId: string;
  monthlyRentPaise: number;
  depositPaise: number;
  leaseStartDate: string; // YYYY-MM-DD
  leaseEndDate: string;
  noticePeriodDays?: number;
  additionalTerms?: string;
}

export interface RentalAgreementResponse {
  agreementId: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocality: string;
  propertyCity: string;
  ownerId: string;
  ownerName: string;
  tenantId: string;
  tenantName: string;
  monthlyRentPaise: number;
  depositPaise: number;
  leaseStartDate: string;
  leaseEndDate: string;
  noticePeriodDays: number;
  status: RentalAgreementStatus;
  ownerAcceptedAt: string | null;
  tenantAcceptedAt: string | null;
  additionalTerms: string | null;
  createdAt: string;
  updatedAt: string;
  htmlBody: string;
}

export interface RentalAgreementSummary {
  agreementId: string;
  propertyId: string;
  propertyTitle: string;
  counterpartyName: string;
  counterpartyRole: "TENANT" | "OWNER";
  monthlyRentPaise: number;
  leaseStartDate: string;
  leaseEndDate: string;
  status: RentalAgreementStatus;
  createdAt: string;
}
