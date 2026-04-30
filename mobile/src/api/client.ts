import type {
  AuthFlowResponse,
  AuthSessionResponse,
  HomeResponse,
  MatchResponse,
  ProductPageCatalogResponse,
  PropertyRemoveSaveResponse,
  PropertyDetailResponse,
  PropertyFaqResponse,
  PropertySaveResponse,
  PropertyReviewsResponse,
  SearchResponse,
  SiteOverviewResponse,
  TenantDashboardResponse,
  UserPreferenceProfileResponse,
  UserProfileResponse,
  VisitListResponse,
  VisitScheduleRequest,
  VisitScheduleResponse,
  VisitSlotsResponse
} from "./types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8080";

type QueryValue = string | number | boolean | undefined | null;
type ApiErrorPayload = {
  message?: string;
  detail?: string;
  error?: string;
};

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

async function fetchJson<T>(path: string, init?: RequestInit, query: Record<string, QueryValue> = {}) {
  const response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response, path));
  }

  return (await response.json()) as T;
}

async function buildErrorMessage(response: Response, path: string) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    const detail = payload.detail ?? payload.message ?? payload.error;
    if (detail) {
      return detail;
    }
  } catch {
    // Fall back to the generic message when the error body is not JSON.
  }

  return `Failed request for ${path} with ${response.status}`;
}

export const mobileApi = {
  getSiteOverview: () => fetchJson<SiteOverviewResponse>("/api/v1/site-overview"),
  getProductPages: () => fetchJson<ProductPageCatalogResponse>("/api/v1/product-pages"),
  getHome: (city = "Bengaluru") => fetchJson<HomeResponse>("/api/v1/home", undefined, { city }),
  search: (query: Record<string, QueryValue>) => fetchJson<SearchResponse>("/api/v1/search", undefined, query),
  getPropertyDetail: (propertyId: string) =>
    fetchJson<PropertyDetailResponse>(`/api/v1/properties/${propertyId}`),
  getPropertyReviews: (propertyId: string) =>
    fetchJson<PropertyReviewsResponse>(`/api/v1/properties/${propertyId}/reviews`, undefined, { page: 0, pageSize: 3 }),
  getPropertyFaq: (propertyId: string) =>
    fetchJson<PropertyFaqResponse>(`/api/v1/properties/${propertyId}/faq`),
  getMatches: (city = "Bengaluru") =>
    fetchJson<MatchResponse>("/api/v1/matches", undefined, { city, page: 0, pageSize: 5 }),
  getDashboard: () => fetchJson<TenantDashboardResponse>("/api/v1/dashboard/tenant"),
  getUserProfile: () => fetchJson<UserProfileResponse>("/api/v1/users/me"),
  getPreferences: () => fetchJson<UserPreferenceProfileResponse>("/api/v1/users/me/preferences"),
  getVisits: () => fetchJson<VisitListResponse>("/api/v1/visits", undefined, { page: 0, pageSize: 5 }),
  getVisitSlots: (propertyId: string, date: string) =>
    fetchJson<VisitSlotsResponse>("/api/v1/visits/slots", undefined, { propertyId, date }),
  scheduleVisit: (payload: VisitScheduleRequest) =>
    fetchJson<VisitScheduleResponse>("/api/v1/visits", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  saveProperty: (propertyId: string) =>
    fetchJson<PropertySaveResponse>(`/api/v1/properties/${propertyId}/save`, {
      method: "POST"
    }),
  removeSavedProperty: (propertyId: string) =>
    fetchJson<PropertyRemoveSaveResponse>(`/api/v1/properties/${propertyId}/save`, {
      method: "DELETE"
    }),
  registerWithPhone: (payload: { fullName: string; countryCode: string; phoneNumber: string }) =>
    fetchJson<AuthFlowResponse>("/auth/register/phone", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  registerWithEmail: (payload: { fullName: string; email: string }) =>
    fetchJson<AuthFlowResponse>("/auth/register/email", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload: { identifier: string; password: string }) =>
    fetchJson<AuthSessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendOtp: (payload: { channel: string; destination: string; purpose: string }) =>
    fetchJson<AuthFlowResponse>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  verifyOtp: (payload: { flowId: string; destination: string; otpCode: string }) =>
    fetchJson<AuthSessionResponse>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  loginWithGoogle: (payload: {
    identityToken?: string;
    authorizationCode?: string;
    redirectUri: string;
  }) =>
    fetchJson<AuthSessionResponse>("/auth/oauth/google", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  loginWithApple: (payload: { authorizationCode: string; redirectUri: string }) =>
    fetchJson<AuthSessionResponse>("/auth/oauth/apple", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  refreshToken: (payload: { refreshToken: string }) =>
    fetchJson<AuthSessionResponse>("/auth/token/refresh", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
