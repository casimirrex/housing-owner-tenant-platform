"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/dictionary";

/**
 * Tier 3 — global locale state.
 *
 * Backed by zustand + persist so every component that calls useTranslation
 * re-renders the moment any LocaleSwitcher anywhere changes the value, and
 * the choice survives page reloads.
 */
interface LocaleState {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (next) => {
        if ((SUPPORTED_LOCALES as readonly string[]).includes(next)) {
          set({ locale: next });
        }
      }
    }),
    {
      name: "testition-locale",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
