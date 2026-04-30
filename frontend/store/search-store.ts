"use client";

import { create } from "zustand";

interface SearchState {
  city: string;
  query: string;
  budgetMax?: number;
  bhk?: string;
  verified?: boolean;
  setFilters: (next: Partial<SearchState>) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  city: "Bengaluru",
  query: "",
  budgetMax: undefined,
  bhk: undefined,
  verified: true,
  setFilters: (next) => set((state) => ({ ...state, ...next }))
}));
