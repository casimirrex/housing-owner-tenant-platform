import { create } from "zustand";
import type { AuthFlowResponse, AuthSessionResponse } from "../api/types";

interface AppState {
  selectedCity: string;
  searchQuery: string;
  savedPropertyIds: string[];
  authSession: AuthSessionResponse | null;
  latestAuthFlow: AuthFlowResponse | null;
  setSelectedCity: (city: string) => void;
  setSearchQuery: (query: string) => void;
  savePropertyId: (propertyId: string) => void;
  removePropertyId: (propertyId: string) => void;
  setAuthSession: (session: AuthSessionResponse | null) => void;
  setLatestAuthFlow: (flow: AuthFlowResponse | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCity: "Bengaluru",
  searchQuery: "",
  savedPropertyIds: ["listing_001", "listing_003"],
  authSession: null,
  latestAuthFlow: null,
  setSelectedCity: (city) => set({ selectedCity: city }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  savePropertyId: (propertyId) =>
    set((state) => ({
      savedPropertyIds: state.savedPropertyIds.includes(propertyId)
        ? state.savedPropertyIds
        : [...state.savedPropertyIds, propertyId]
    })),
  removePropertyId: (propertyId) =>
    set((state) => ({
      savedPropertyIds: state.savedPropertyIds.filter((id) => id !== propertyId)
    })),
  setAuthSession: (authSession) => set({ authSession }),
  setLatestAuthFlow: (latestAuthFlow) => set({ latestAuthFlow })
}));
