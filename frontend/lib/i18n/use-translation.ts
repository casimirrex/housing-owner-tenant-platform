"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  type TranslationKey,
  dictionaries
} from "./dictionary";

const STORAGE_KEY = "testition-locale";

/**
 * Returns the current locale, a `t()` translator, and a setter for the
 * locale. Persists the choice in localStorage.
 *
 * Used by the LocaleSwitcher and any component that wants Hindi/Kannada/
 * Tamil strings. Call sites still default to English text — Tier 3
 * intentionally ships with a small dictionary; future PRs can extend keys.
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
        setLocaleState(stored as SupportedLocale);
      }
    } catch {
      /* no-op */
    }
    setHydrated(true);
  }, []);

  const setLocale = (next: SupportedLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* no-op */
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const localeDict = dictionaries[locale] ?? {};
    const value = localeDict[key];
    if (typeof value === "string") return value;
    // Fall back to English, then to the supplied fallback / key itself.
    const enValue = dictionaries.en[key];
    if (typeof enValue === "string") return enValue;
    return fallback ?? key;
  };

  return { locale, setLocale, t, hydrated };
}
