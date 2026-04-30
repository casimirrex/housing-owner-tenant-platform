"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthSessionResponse } from "@/lib/api/types";

interface AuthState {
  session: AuthSessionResponse | null;
  statusMessage: string | null;
  setSession: (session: AuthSessionResponse) => void;
  updateSessionIdentity: (identity: {
    fullName?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
  }) => void;
  clearSession: (message?: string) => void;
  setStatusMessage: (message: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      statusMessage: null,
      setSession: (session) => set({ session, statusMessage: session.message }),
      updateSessionIdentity: (identity) =>
        set((state) => {
          if (!state.session) {
            return state;
          }

          const nextSession = { ...state.session };

          if ("fullName" in identity) {
            nextSession.fullName = identity.fullName ?? null;
          }
          if ("avatarUrl" in identity) {
            nextSession.avatarUrl = identity.avatarUrl ?? null;
          }
          if ("email" in identity) {
            nextSession.email = identity.email ?? null;
          }

          return { session: nextSession };
        }),
      clearSession: (message) => set({ session: null, statusMessage: message ?? null }),
      setStatusMessage: (message) => set({ statusMessage: message })
    }),
    {
      name: "housing-owner-tenant-auth",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
