import type {
  AuthFlowResponse,
  AuthSessionResponse,
  FilterMetadataResponse,
  HomeResponse,
  ListingCollectionResponse,
  MatchesResponse,
  LogoutResponse,
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
  ListingPromotionResponse,
  OwnerAnalyticsResponse,
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
