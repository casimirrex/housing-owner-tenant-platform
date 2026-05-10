"use client";

import { Globe } from "lucide-react";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n/dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Tier 3 — locale switcher. A compact `<select>` so it fits in any nav bar
 * without extra layout. Persists the choice via localStorage; useTranslation
 * picks it up across the app.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, hydrated } = useTranslation();

  // Render a stable label until hydration to avoid SSR mismatch flashes.
  const displayLocale = hydrated ? locale : "en";

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/65 hover:border-pine ${className}`}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={displayLocale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="cursor-pointer bg-transparent pr-1 text-xs font-semibold text-ink focus:outline-none"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
