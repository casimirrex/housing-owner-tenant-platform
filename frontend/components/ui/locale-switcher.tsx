"use client";

import { Globe } from "lucide-react";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Locale switcher with Google Translate cookie integration.
 *
 * On change:
 *   1. Update our internal locale store (drives the dictionary t() helper).
 *   2. Set the `googtrans` cookie that Google's Website Translator widget
 *      reads — this is what makes Google translate the ENTIRE page line by
 *      line (including content our dictionary doesn't cover).
 *   3. Reload the page so the widget applies the new language from scratch.
 *      Without a reload, Google's script doesn't pick up the cookie change.
 *
 * Two cookies are set per locale so the value survives both same-origin
 * and parent-domain navigation:
 *   - `googtrans=/en/<locale>; path=/`
 *   - `googtrans=/en/<locale>; path=/; domain=.<hostname>`
 *
 * Switching back to English clears both cookies (Google interprets the
 * absence of `googtrans` as "show the original page").
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, hydrated } = useTranslation();

  const displayLocale = hydrated ? locale : "en";

  const handleChange = (next: SupportedLocale) => {
    if (typeof document !== "undefined") {
      const host = window.location.hostname;
      // Strip the leftmost subdomain for the parent-domain cookie (e.g.
      // `www.testition.tech` → `.testition.tech`). For plain `localhost`
      // or single-segment hosts the parent-domain cookie is skipped.
      const parts = host.split(".");
      const parentDomain =
        parts.length >= 2 ? "." + parts.slice(-2).join(".") : null;

      if (next === "en") {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        if (parentDomain) {
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${parentDomain}`;
        }
      } else {
        document.cookie = `googtrans=/en/${next}; path=/`;
        if (parentDomain) {
          document.cookie = `googtrans=/en/${next}; path=/; domain=${parentDomain}`;
        }
      }
    }

    setLocale(next);

    // Reload so Google Translate re-evaluates the cookie from a fresh page.
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/65 hover:border-pine ${className}`}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={displayLocale}
        onChange={(event) => handleChange(event.target.value as SupportedLocale)}
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
