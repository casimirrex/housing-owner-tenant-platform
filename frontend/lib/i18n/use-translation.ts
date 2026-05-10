"use client";

import { useEffect, useState } from "react";
import { useLocaleStore } from "@/store/locale-store";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
  type TranslationKey,
  dictionaries
} from "./dictionary";

/**
 * Returns the current locale (from the global zustand store), a `t()`
 * translator that falls back through the chain locale → en → key, and a
 * `setLocale` setter wired to the same store. Persistence is handled by
 * the store's persist middleware.
 *
 * `hydrated` flips to true after the first client effect — until then we
 * fall back to English so the server-rendered HTML matches what every
 * client gets on the very first paint. After hydration, the persisted
 * choice takes over and triggers a re-render via zustand.
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const activeLocale: SupportedLocale = hydrated ? locale : DEFAULT_LOCALE;

  const t = (key: TranslationKey, fallback?: string): string => {
    const localeDict = dictionaries[activeLocale] ?? {};
    const value = localeDict[key];
    if (typeof value === "string") return value;
    const enValue = dictionaries.en[key];
    if (typeof enValue === "string") return enValue;
    return fallback ?? key;
  };

  return { locale: activeLocale, setLocale, t, hydrated };
}
