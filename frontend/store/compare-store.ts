"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Tier 2 #7 — Compare Properties.
 *
 * Pure client-side store: a list of listing IDs the user has marked for
 * side-by-side comparison. Persists in localStorage so the comparison
 * survives page reloads and device sessions.
 *
 * Cap: 3 properties (UX constraint — fits comfortably side-by-side on
 * desktop and stacks cleanly on mobile).
 *
 * Backend has zero awareness of this — the /compare page just fetches
 * each property by ID via the existing /api/v1/properties/{id} endpoint.
 */

export const COMPARE_MAX = 3;

interface CompareState {
  listingIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  /** Number of slots available — for UI hints like "2/3 in compare". */
  remaining: () => number;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      listingIds: [],
      add: (id) =>
        set((state) => {
          if (state.listingIds.includes(id)) return state;
          if (state.listingIds.length >= COMPARE_MAX) return state;
          return { listingIds: [...state.listingIds, id] };
        }),
      remove: (id) =>
        set((state) => ({
          listingIds: state.listingIds.filter((existing) => existing !== id)
        })),
      clear: () => set({ listingIds: [] }),
      has: (id) => get().listingIds.includes(id),
      remaining: () => COMPARE_MAX - get().listingIds.length
    }),
    {
      name: "housing-compare",
      storage: createJSONStorage(() => localStorage),
      // Only persist the array — methods are reconstructed from create().
      partialize: (state) => ({ listingIds: state.listingIds })
    }
  )
);
