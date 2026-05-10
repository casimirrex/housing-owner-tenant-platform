"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/store/locale-store";

/**
 * Tier 3 — keeps `<html lang>` in sync with the active locale.
 *
 * Chrome offers to translate a page when its `lang` attribute differs from
 * the user's preferred language. Setting this dynamically means:
 *   - Strings we DO translate via t() show in the chosen locale immediately.
 *   - Strings we haven't translated yet are flagged to the browser, so users
 *     can right-click → "Translate to <X>" and Chrome will fill in the rest.
 *
 * No-op on the server; only runs on the client after hydration.
 */
export function HtmlLangSync() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
