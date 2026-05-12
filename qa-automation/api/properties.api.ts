import type { ApiClient } from "./client";

export type ListingSummary = {
  listingId: string;
  title: string;
  city: string;
  locality: string;
  rent: number;
  bhk: string;
  verified: boolean;
  featured?: boolean;
};

export type ListingPage = {
  results: ListingSummary[];
  totalElements: number;
  pageNumber: number;
  pageSize: number;
};

export const PropertiesApi = {
  search(client: ApiClient, query: { city?: string; bhk?: string; rentMax?: number } = {}): Promise<ListingPage> {
    return client.get<ListingPage>("/api/v1/properties/search", { query });
  },

  get(client: ApiClient, listingId: string): Promise<ListingSummary> {
    return client.get<ListingSummary>(`/api/v1/properties/${listingId}`);
  }
};
