import type {
  AuthFlowResponse,
  AuthSessionResponse,
  FilterMetadataResponse,
  HomeResponse,
  ListingCollectionResponse,
  AdminListingsResponse,
  AdminListingStatus,
  AdminReportAction,
  AdminReportItem,
  AdminReportsResponse,
  AdminStatsResponse,
  AdminUsersResponse,
  ListingReportRequestBody,
  ListingReportResponse,
  MatchesResponse,
  LogoutResponse,
  NearbyResponse,
  ListingTemplateCreateBody,
  ListingTemplateItem,
  ListingTemplateListResponse,
  MaintenanceListResponse,
  MaintenanceRequestCreateBody,
  MaintenanceRequestItem,
  MaintenanceUpdateStatusBody,
  ReviewEligibilityResponse,
  ReviewSubmitRequestBody,
  ReviewSubmittedResponse,
  RoommateMatchesResponse,
  RoommateProfile,
  RoommateProfileRequestBody,
  UserBlock,
  UserBlockListResponse,
  UserBlockRequestBody,
  OwnerListingsResponse,
  OwnerGetStartedResponse,
  OwnerCreatePaymentRecordRequest,
  OwnerCreatePaymentRecordResponse,
  PaymentCheckoutResponse,
  PaymentDashboardResponse,
  PaymentVerificationResponse,
  PropertyDetailResponse,
  PropertyFaqResponse,
  PropertyReviewsResponse,
  RemovePropertyResponse,
  SavePropertyResponse,
  SearchMapRequest,
  SearchMapResponse,
  SearchResponse,
  SupportEnquiryRequest,
  SupportEnquiryResponse,
  TenantPremiumAccessResponse,
  TenantPremiumActivationResponse,
  TenantDashboardResponse,
  UserAccountDeactivationResponse,
  UserPhotoUploadResponse,
  UserPasswordUpdateResponse,
  LeadContactResponse,
  ListingPromotionResponse,
  ChatMessage,
  ChatMessagesResponse,
  ChatThreadResponse,
  OwnerAnalyticsResponse,
  OwnerLeadsResponse,
  OwnerVerificationResponse,
  OwnerVisitsResponse,
  SavedSearchAlertsResponse,
  SavedSearchRequestBody,
  SavedSearchResponse,
  VisitScheduleResponse,
  VisitSlotsResponse,
  UserPreferenceProfileResponse,
  UserPreferenceUpdateResponse,
  UserProfileResponse,
  UserProfileUpdateResponse,
  UserRolesResponse,
  UserVerificationStatusResponse,
  VisitsResponse,
  WalletDashboardResponse,
  WalletTopupCheckoutResponse,
  WalletTopupVerifyResponse,
  WebContentPageResponse
} from "@/lib/api/types";
import {
  getFallbackFilterMetadata,
  getFallbackHome,
  getFallbackListingCollection,
  getFallbackPropertyDetail,
  getFallbackPropertyFaq,
  getFallbackPropertyReviews,
  getFallbackSearch,
  getFallbackSearchMap,
  getFallbackWebContentPage
} from "@/lib/api/fallback-data";

const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8080";
const INTERNAL_API_BASE_URL =
  process.env.API_BASE_URL_INTERNAL?.replace(/\/$/, "") ?? PUBLIC_API_BASE_URL;

type QueryValue = string | number | boolean | undefined | null;
type ApiErrorPayload = {
  message?: string;
  detail?: string;
  error?: string;
};

function getApiBaseUrl() {
  return typeof window === "undefined" ? INTERNAL_API_BASE_URL : PUBLIC_API_BASE_URL;
}

function buildHeaders(headers?: HeadersInit, accessToken?: string) {
  const nextHeaders = new Headers(headers ?? {});
  if (!nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  return nextHeaders;
}

function toQueryString(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
  query: Record<string, QueryValue> = {},
  accessToken?: string
) {
  const response = await fetch(`${getApiBaseUrl()}${path}${toQueryString(query)}`, {
    ...init,
    headers: buildHeaders(init?.headers, accessToken),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response, path));
  }

  return (await response.json()) as T;
}

async function fetchJsonWithFallback<T>(
  path: string,
  fallback: () => T | Promise<T>,
  init?: RequestInit,
  query: Record<string, QueryValue> = {},
  accessToken?: string
) {
  try {
    return await fetchJson<T>(path, init, query, accessToken);
  } catch (error) {
    console.warn(`[fallback] Using local content for ${path}`, error);
    return fallback();
  }
}

async function buildErrorMessage(response: Response, path: string) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    const detail = payload.detail ?? payload.message ?? payload.error;
    if (detail) {
      return detail;
    }
  } catch {
    // Fall back to the status message below when the response is not JSON.
  }

  return `Backend request failed for ${path} with ${response.status}`;
}

export function getHome(city = "Bengaluru") {
  return fetchJsonWithFallback<HomeResponse>(
    "/api/v1/home",
    () => getFallbackHome(city),
    undefined,
    { city }
  );
}

export function getTrending(city: string, page = 0, pageSize = 6) {
  return fetchJsonWithFallback<ListingCollectionResponse>(
    "/api/v1/listings/trending",
    () => getFallbackListingCollection(city),
    undefined,
    {
      city,
      page,
      pageSize
    }
  );
}

export function getNewListings(city: string, page = 0, pageSize = 6) {
  return fetchJsonWithFallback<ListingCollectionResponse>(
    "/api/v1/listings/new",
    () => getFallbackListingCollection(city),
    undefined,
    {
      city,
      page,
      pageSize
    }
  );
}

export function searchListings(query: Record<string, QueryValue>) {
  return fetchJsonWithFallback<SearchResponse>(
    "/api/v1/search",
    () => getFallbackSearch(query),
    undefined,
    query
  );
}

export function searchMap(request: SearchMapRequest) {
  return fetchJsonWithFallback<SearchMapResponse>(
    "/api/v1/search/map",
    () => getFallbackSearchMap(request),
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

export function searchNearby(lat: number, lng: number, radiusKm = 5) {
  return fetchJson<NearbyResponse>("/api/v1/locations/nearby", undefined, {
    lat,
    lng,
    radiusKm
  });
}

export function getFilterMetadata(city: string) {
  return fetchJsonWithFallback<FilterMetadataResponse>(
    "/api/v1/filters/metadata",
    () => getFallbackFilterMetadata(),
    undefined,
    { city }
  );
}

export function getPropertyDetail(propertyId: string, accessToken?: string) {
  return fetchJsonWithFallback<PropertyDetailResponse>(
    `/api/v1/properties/${propertyId}`,
    () => getFallbackPropertyDetail(propertyId),
    undefined,
    {},
    accessToken
  );
}

export function getPropertyReviews(propertyId: string, page = 0, pageSize = 5) {
  return fetchJsonWithFallback<PropertyReviewsResponse>(
    `/api/v1/properties/${propertyId}/reviews`,
    () => getFallbackPropertyReviews(),
    undefined,
    { page, pageSize }
  );
}

export function getPropertyFaq(propertyId: string) {
  return fetchJsonWithFallback<PropertyFaqResponse>(
    `/api/v1/properties/${propertyId}/faq`,
    () => getFallbackPropertyFaq()
  );
}

export function saveProperty(propertyId: string) {
  return fetchJson<SavePropertyResponse>(`/api/v1/properties/${propertyId}/save`, {
    method: "POST"
  });
}

export function getReviewEligibility(propertyId: string, accessToken?: string) {
  return fetchJson<ReviewEligibilityResponse>(
    `/api/v1/properties/${propertyId}/reviews/eligibility`,
    undefined,
    {},
    accessToken
  );
}

export function submitReview(
  propertyId: string,
  body: ReviewSubmitRequestBody,
  accessToken?: string
) {
  return fetchJson<ReviewSubmittedResponse>(
    `/api/v1/properties/${propertyId}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    {},
    accessToken
  );
}

/* ── Tier 1: Admin dashboard ─────────────────────────────────────────── */

export function adminGetStats(accessToken?: string) {
  return fetchJson<AdminStatsResponse>("/api/v1/admin/stats", undefined, {}, accessToken);
}

export function adminListUsers(
  query: { search?: string; role?: string; page?: number; pageSize?: number },
  accessToken?: string
) {
  return fetchJson<AdminUsersResponse>(
    "/api/v1/admin/users",
    undefined,
    {
      search: query.search,
      role: query.role,
      page: query.page ?? 0,
      pageSize: query.pageSize ?? 20
    },
    accessToken
  );
}

export function adminListListings(
  query: { status?: string; onlyFlagged?: boolean; page?: number; pageSize?: number },
  accessToken?: string
) {
  return fetchJson<AdminListingsResponse>(
    "/api/v1/admin/listings",
    undefined,
    {
      status: query.status,
      onlyFlagged: query.onlyFlagged,
      page: query.page ?? 0,
      pageSize: query.pageSize ?? 20
    },
    accessToken
  );
}

export function adminModerateListing(
  listingId: string,
  status: AdminListingStatus,
  accessToken?: string
) {
  return fetchJson<void>(
    `/api/v1/admin/listings/${listingId}/moderate`,
    {
      method: "PATCH",
      body: JSON.stringify({ status })
    },
    {},
    accessToken
  );
}

export function adminListReports(
  query: { status?: string; page?: number; pageSize?: number },
  accessToken?: string
) {
  return fetchJson<AdminReportsResponse>(
    "/api/v1/admin/reports",
    undefined,
    {
      status: query.status,
      page: query.page ?? 0,
      pageSize: query.pageSize ?? 20
    },
    accessToken
  );
}

export function adminActOnReport(
  reportId: string,
  body: { status: AdminReportAction; resolutionNote?: string },
  accessToken?: string
) {
  return fetchJson<AdminReportItem>(
    `/api/v1/admin/reports/${reportId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body)
    },
    {},
    accessToken
  );
}

/* ── Tier 2: Maintenance ─────────────────────────────────────────────── */

export function createMaintenanceRequest(
  body: MaintenanceRequestCreateBody,
  accessToken?: string
) {
  return fetchJson<MaintenanceRequestItem>(
    "/api/v1/maintenance/requests",
    { method: "POST", body: JSON.stringify(body) },
    {},
    accessToken
  );
}

export function listTenantMaintenance(
  query: { status?: string; page?: number; pageSize?: number },
  accessToken?: string
) {
  return fetchJson<MaintenanceListResponse>(
    "/api/v1/maintenance/requests/tenant",
    undefined,
    { status: query.status, page: query.page ?? 0, pageSize: query.pageSize ?? 20 },
    accessToken
  );
}

export function listOwnerMaintenance(
  query: { status?: string; page?: number; pageSize?: number },
  accessToken?: string
) {
  return fetchJson<MaintenanceListResponse>(
    "/api/v1/maintenance/requests/owner",
    undefined,
    { status: query.status, page: query.page ?? 0, pageSize: query.pageSize ?? 20 },
    accessToken
  );
}

export function updateMaintenanceStatus(
  requestId: string,
  body: MaintenanceUpdateStatusBody,
  accessToken?: string
) {
  return fetchJson<MaintenanceRequestItem>(
    `/api/v1/maintenance/requests/${requestId}/status`,
    { method: "PATCH", body: JSON.stringify(body) },
    {},
    accessToken
  );
}

export function cancelMaintenanceRequest(requestId: string, accessToken?: string) {
  return fetchJson<void>(
    `/api/v1/maintenance/requests/${requestId}`,
    { method: "DELETE" },
    {},
    accessToken
  );
}

/* ── Tier 2: Listing templates ───────────────────────────────────────── */

export function listListingTemplates(accessToken?: string) {
  return fetchJson<ListingTemplateListResponse>(
    "/api/v1/owners/listing-templates",
    undefined,
    {},
    accessToken
  );
}

export function createListingTemplate(
  body: ListingTemplateCreateBody,
  accessToken?: string
) {
  return fetchJson<ListingTemplateItem>(
    "/api/v1/owners/listing-templates",
    { method: "POST", body: JSON.stringify(body) },
    {},
    accessToken
  );
}

export function deleteListingTemplate(templateId: string, accessToken?: string) {
  return fetchJson<void>(
    `/api/v1/owners/listing-templates/${templateId}`,
    { method: "DELETE" },
    {},
    accessToken
  );
}

/* ── Tier 2: Roommates ───────────────────────────────────────────────── */

export function getMyRoommateProfile(accessToken?: string) {
  return fetchJson<RoommateProfile>(
    "/api/v1/roommates/profile/me",
    undefined,
    {},
    accessToken
  );
}

export function upsertRoommateProfile(
  body: RoommateProfileRequestBody,
  accessToken?: string
) {
  return fetchJson<RoommateProfile>(
    "/api/v1/roommates/profile/me",
    { method: "PUT", body: JSON.stringify(body) },
    {},
    accessToken
  );
}

export function findRoommateMatches(limit = 20, accessToken?: string) {
  return fetchJson<RoommateMatchesResponse>(
    "/api/v1/roommates/matches",
    undefined,
    { limit },
    accessToken
  );
}

export function listUserBlocks(accessToken?: string) {
  return fetchJson<UserBlockListResponse>(
    "/api/v1/users/blocks",
    undefined,
    {},
    accessToken
  );
}

export function blockUser(body: UserBlockRequestBody, accessToken?: string) {
  return fetchJson<UserBlock>(
    "/api/v1/users/blocks",
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    {},
    accessToken
  );
}

export function unblockUser(blockedUserId: string, accessToken?: string) {
  return fetchJson<void>(
    `/api/v1/users/blocks/${blockedUserId}`,
    {
      method: "DELETE"
    },
    {},
    accessToken
  );
}

export function reportProperty(
  propertyId: string,
  body: ListingReportRequestBody,
  accessToken?: string
) {
  return fetchJson<ListingReportResponse>(
    `/api/v1/properties/${propertyId}/report`,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    {},
    accessToken
  );
}

export function removeSavedProperty(propertyId: string) {
  return fetchJson<RemovePropertyResponse>(`/api/v1/properties/${propertyId}/save`, {
    method: "DELETE"
  });
}

export function login(request: { identifier: string; password: string; roleHint?: "OWNER" | "TENANT" }) {
  return fetchJson<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function registerWithEmail(request: {
  fullName: string;
  email: string;
  password: string;
  role?: "TENANT" | "OWNER";
}) {
  return fetchJson<AuthSessionResponse>("/auth/register/email", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function registerWithPhone(request: {
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  role?: "TENANT" | "OWNER";
}) {
  return fetchJson<AuthSessionResponse>("/auth/register/phone", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function sendOtp(request: {
  channel: string;
  destination: string;
  purpose: string;
}) {
  return fetchJson<AuthFlowResponse>("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function verifyOtp(request: {
  flowId: string;
  destination: string;
  otpCode: string;
}) {
  return fetchJson<AuthSessionResponse>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function loginWithGoogle(request: {
  identityToken?: string;
  authorizationCode?: string;
  codeVerifier?: string;
  redirectUri: string;
  role?: "TENANT" | "OWNER";
}) {
  return fetchJson<AuthSessionResponse>("/auth/oauth/google", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function loginWithApple(request: {
  authorizationCode: string;
  redirectUri: string;
}) {
  return fetchJson<AuthSessionResponse>("/auth/oauth/apple", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function refreshSession(request: { refreshToken: string }) {
  return fetchJson<AuthSessionResponse>("/auth/token/refresh", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function logoutSession(request: { refreshToken: string }) {
  return fetchJson<LogoutResponse>("/auth/logout", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function getWebContentPage(slug: string) {
  return fetchJsonWithFallback<WebContentPageResponse>(
    `/api/v1/web-content/${slug}`,
    () => getFallbackWebContentPage(slug)
  );
}

export function submitSupportEnquiry(request: SupportEnquiryRequest) {
  return fetchJson<SupportEnquiryResponse>("/api/v1/support/enquiries", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function getCurrentUserProfile(accessToken?: string) {
  return fetchJson<UserProfileResponse>("/api/v1/users/me", undefined, {}, accessToken);
}

export function updateCurrentUserProfile(request: {
  fullName: string;
  gender: string;
  city: string;
  dateOfBirth?: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  employmentType?: string;
  employerName?: string;
  monthlyIncomeRange?: string;
  previousLandlordName?: string;
  previousLandlordPhone?: string;
  aadhaarLast4?: string;
  panCardNumber?: string;
  governmentIdType?: string;
  governmentIdPhotoUrl?: string;
  upiId?: string;
  photoUrl: string;
}, accessToken?: string) {
  return fetchJson<UserProfileUpdateResponse>("/api/v1/users/me", {
    method: "PUT",
    body: JSON.stringify(request)
  }, {}, accessToken);
}

export function getUserPreferences(accessToken?: string) {
  return fetchJson<UserPreferenceProfileResponse>(
    "/api/v1/users/me/preferences",
    undefined,
    {},
    accessToken
  );
}

export function updateUserPreferences(request: {
  budgetMin: number;
  budgetMax: number;
  bhkPreference: string;
  furnishingPreference: string;
  commuteLocation: string;
  moveInDate?: string;
  petFriendly: boolean;
  tenantType: string;
  lifestyleTags: string[];
}, accessToken?: string) {
  return fetchJson<UserPreferenceUpdateResponse>("/api/v1/users/me/preferences", {
    method: "PUT",
    body: JSON.stringify(request)
  }, {}, accessToken);
}

export function getUserVerificationStatus(accessToken?: string) {
  return fetchJson<UserVerificationStatusResponse>(
    "/api/v1/users/me/verification-status",
    undefined,
    {},
    accessToken
  );
}

export function uploadUserPhoto(request: { photoUrl: string }, accessToken?: string) {
  return fetchJson<UserPhotoUploadResponse>("/api/v1/users/me/photo", {
    method: "POST",
    body: JSON.stringify(request)
  }, {}, accessToken);
}

export function setCurrentUserPassword(request: { newPassword: string }, accessToken?: string) {
  return fetchJson<UserPasswordUpdateResponse>("/api/v1/users/me/password", {
    method: "PUT",
    body: JSON.stringify(request)
  }, {}, accessToken);
}

export function deactivateCurrentUser(accessToken?: string) {
  return fetchJson<UserAccountDeactivationResponse>("/api/v1/users/me", {
    method: "DELETE"
  }, {}, accessToken);
}

export function getTenantDashboard(accessToken?: string) {
  return fetchJson<TenantDashboardResponse>(
    "/api/v1/dashboard/tenant",
    undefined,
    {},
    accessToken
  );
}

export function getMatches(
  query: {
    page?: number;
    pageSize?: number;
    city?: string;
  } = {},
  accessToken?: string
) {
  return fetchJson<MatchesResponse>("/api/v1/matches", undefined, query, accessToken);
}

export function getTenantVisits(
  query: {
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
  accessToken?: string
) {
  return fetchJson<VisitsResponse>("/api/v1/visits", undefined, query, accessToken);
}

export function getOwnerListings(
  query: {
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
  accessToken?: string
) {
  return fetchJson<OwnerListingsResponse>(
    "/api/v1/owners/listings",
    undefined,
    query,
    accessToken
  );
}

export function startOwnerAccess(request: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
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
}) {
  return fetchJson<OwnerGetStartedResponse>(
    "/api/v1/owners/get-started",
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

export function createOwnerListing(
  request: {
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
    lat: number;
    lng: number;
  },
  accessToken?: string
) {
  return fetchJson<{ listingId: string; status: string; createdAt: string }>(
    "/api/v1/owners/listings",
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function createOwnerPaymentRecord(
  request: OwnerCreatePaymentRecordRequest,
  accessToken?: string
) {
  return fetchJson<OwnerCreatePaymentRecordResponse>(
    "/api/v1/owners/payment-records",
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function updateOwnerListing(
  listingId: string,
  request: {
    title: string;
    rent: number;
    deposit: number;
    amenities: string[];
    availabilityDate: string;
    photos: string[];
  },
  accessToken?: string
) {
  return fetchJson<{ updated: boolean; listing: unknown }>(
    `/api/v1/owners/listings/${listingId}`,
    {
      method: "PUT",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function getPaymentsDashboard(accessToken?: string) {
  return fetchJson<PaymentDashboardResponse>(
    "/api/v1/payments/dashboard",
    undefined,
    {},
    accessToken
  );
}

export function createPaymentCheckout(request: { paymentId: string }, accessToken?: string) {
  return fetchJson<PaymentCheckoutResponse>(
    "/api/v1/payments/checkout",
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function verifyPayment(
  request: {
    paymentId: string;
    providerOrderId?: string;
    providerPaymentId?: string;
    providerSignature?: string;
  },
  accessToken?: string
) {
  return fetchJson<PaymentVerificationResponse>(
    "/api/v1/payments/verify",
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

/* ─── Wallet ─────────────────────────────────────────────────────────────── */

export function getWalletDashboard(accessToken?: string) {
  return fetchJson<WalletDashboardResponse>(
    "/api/v1/wallet",
    undefined,
    {},
    accessToken
  );
}

export function createWalletTopupCheckout(
  request: { amount: number; currency: string },
  accessToken?: string
) {
  return fetchJson<WalletTopupCheckoutResponse>(
    "/api/v1/wallet/topup/checkout",
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function verifyWalletTopup(
  request: { txnId: string; paymentIntentId: string },
  accessToken?: string
) {
  return fetchJson<WalletTopupVerifyResponse>(
    "/api/v1/wallet/topup/verify",
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function getTenantPremiumAccess(accessToken?: string) {
  return fetchJson<TenantPremiumAccessResponse>(
    "/api/v1/subscriptions/tenant-premium",
    undefined,
    {},
    accessToken
  );
}

export function activateTenantPremium(accessToken?: string) {
  return fetchJson<TenantPremiumActivationResponse>(
    "/api/v1/subscriptions/tenant-premium/activate",
    {
      method: "POST"
    },
    {},
    accessToken
  );
}

export function getOwnerPremiumAccess(accessToken?: string) {
  return fetchJson<TenantPremiumAccessResponse>(
    "/api/v1/subscriptions/owner-premium",
    undefined,
    {},
    accessToken
  );
}

export function activateOwnerPremium(accessToken?: string) {
  return fetchJson<TenantPremiumActivationResponse>(
    "/api/v1/subscriptions/owner-premium/activate",
    {
      method: "POST"
    },
    {},
    accessToken
  );
}

/* ── Role management (Bug F multi-role) ────────────────────────────────── */

export function getUserRoles(accessToken?: string) {
  return fetchJson<UserRolesResponse>(
    "/api/v1/auth/roles/me",
    undefined,
    {},
    accessToken
  );
}

export function addUserRole(role: "TENANT" | "OWNER", accessToken?: string) {
  return fetchJson<UserRolesResponse>(
    "/api/v1/auth/roles/add",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    },
    {},
    accessToken
  );
}

export function switchUserRole(role: "TENANT" | "OWNER", accessToken?: string) {
  return fetchJson<UserRolesResponse>(
    "/api/v1/auth/roles/switch",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    },
    {},
    accessToken
  );
}

/* ── Owner analytics ───────────────────────────────────────────────────── */

export function getOwnerAnalytics(accessToken?: string) {
  return fetchJson<OwnerAnalyticsResponse>(
    "/api/v1/owners/analytics",
    undefined,
    {},
    accessToken
  );
}

/* ── Featured Listings (paid promotion) ───────────────────────────────── */

export function promoteListing(
  listingId: string,
  durationDays: 7 | 30,
  accessToken?: string
) {
  return fetchJson<ListingPromotionResponse>(
    `/api/v1/owners/listings/${encodeURIComponent(listingId)}/promote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationDays })
    },
    {},
    accessToken
  );
}

/* ── Verified Owner Badge (Tier 1 #2) ─────────────────────────────────── */

export function getOwnerVerification(accessToken?: string) {
  return fetchJson<OwnerVerificationResponse>(
    "/api/v1/owners/verification",
    undefined,
    {},
    accessToken
  );
}

export function purchaseOwnerVerification(accessToken?: string) {
  return fetchJson<OwnerVerificationResponse>(
    "/api/v1/owners/verification",
    { method: "POST" },
    {},
    accessToken
  );
}

/* ── Pay-to-Contact / Express Interest (Tier 1 #3) ────────────────────── */

export function expressInterest(
  listingId: string,
  message: string | null,
  accessToken?: string
) {
  return fetchJson<LeadContactResponse>(
    `/api/v1/properties/${encodeURIComponent(listingId)}/contact`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message || "" })
    },
    {},
    accessToken
  );
}

export function getOwnerLeads(accessToken?: string) {
  return fetchJson<OwnerLeadsResponse>(
    "/api/v1/owners/leads",
    undefined,
    {},
    accessToken
  );
}

/* ── Visit Booking (Tier 2 #5) ────────────────────────────────────────── */

export function getVisitSlots(
  propertyId: string,
  date: string,
  accessToken?: string
) {
  return fetchJson<VisitSlotsResponse>(
    "/api/v1/visits/slots",
    undefined,
    { propertyId, date },
    accessToken
  );
}

export function scheduleVisit(
  request: { propertyId: string; slotId: string; preferredDate: string; notes?: string },
  accessToken?: string
) {
  return fetchJson<VisitScheduleResponse>(
    "/api/v1/visits",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    },
    {},
    accessToken
  );
}

export function getOwnerVisits(accessToken?: string) {
  return fetchJson<OwnerVisitsResponse>(
    "/api/v1/owners/visits",
    undefined,
    {},
    accessToken
  );
}

/* ── Saved Searches + Alerts (Tier 2 #4) ──────────────────────────────── */

export function createSavedSearch(body: SavedSearchRequestBody, accessToken?: string) {
  return fetchJson<SavedSearchResponse>(
    "/api/v1/saved-searches",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    },
    {},
    accessToken
  );
}

export function listSavedSearches(accessToken?: string) {
  return fetchJson<SavedSearchResponse[]>(
    "/api/v1/saved-searches",
    undefined,
    {},
    accessToken
  );
}

export function deleteSavedSearch(searchId: string, accessToken?: string) {
  return fetchJson<void>(
    `/api/v1/saved-searches/${encodeURIComponent(searchId)}`,
    { method: "DELETE" },
    {},
    accessToken
  );
}

export function listSavedSearchAlerts(accessToken?: string) {
  return fetchJson<SavedSearchAlertsResponse>(
    "/api/v1/saved-searches/alerts",
    undefined,
    {},
    accessToken
  );
}

export function markAlertRead(alertId: string, accessToken?: string) {
  return fetchJson<void>(
    `/api/v1/saved-searches/alerts/${encodeURIComponent(alertId)}/read`,
    { method: "PATCH" },
    {},
    accessToken
  );
}

export function markAllAlertsRead(accessToken?: string) {
  return fetchJson<void>(
    "/api/v1/saved-searches/alerts/read-all",
    { method: "POST" },
    {},
    accessToken
  );
}

/* ── In-app Chat (Tier 2 #6) ──────────────────────────────────────────── */

export function startChatThread(listingId: string, accessToken?: string) {
  return fetchJson<ChatThreadResponse>(
    "/api/v1/chat/threads",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId })
    },
    {},
    accessToken
  );
}

export function listChatThreads(accessToken?: string) {
  return fetchJson<ChatThreadResponse[]>(
    "/api/v1/chat/threads",
    undefined,
    {},
    accessToken
  );
}

export function fetchChatMessages(threadId: string, accessToken?: string) {
  return fetchJson<ChatMessagesResponse>(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
    undefined,
    {},
    accessToken
  );
}

export function sendChatMessage(
  threadId: string,
  content: string,
  accessToken?: string,
  imageUrl?: string
) {
  return fetchJson<ChatMessage>(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrl })
    },
    {},
    accessToken
  );
}

export function markThreadRead(threadId: string, accessToken?: string) {
  return fetchJson<void>(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}/read`,
    { method: "POST" },
    {},
    accessToken
  );
}

/* ── File upload (Bug G.3 — listing cover photo) ──────────────────────── */

export async function uploadListingPhoto(file: File, accessToken?: string): Promise<{
  url: string;
  originalFilename: string;
  storedFilename: string;
  sizeBytes: number;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  // Don't set Content-Type — fetch will set the multipart boundary automatically.

  const path = "/api/v1/uploads/listing-photo";
  // Reuse the same base-url logic as fetchJson but without the JSON header.
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    body: formData,
    headers
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // ignore — keep the default message
    }
    throw new Error(message);
  }

  return response.json();
}
