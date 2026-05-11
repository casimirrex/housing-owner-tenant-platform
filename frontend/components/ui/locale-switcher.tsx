"use client";

import { Globe } from "lucide-react";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Locale switcher — updates our internal Zustand store; AutoTranslator
 * (mounted in the root layout) re-walks the DOM and translates every
 * text node whose trimmed content matches a key in the content
 * dictionary. No page reload, no third-party scripts, no Chrome
 * translate prompts.
 *
 * Coverage limitation: only strings in the dictionary translate. Add
 * entries to `lib/i18n/auto-translate-dictionary.ts` whenever something
 * stays English — and the next deploy picks them up.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, hydrated } = useTranslation();

  const displayLocale = hydrated ? locale : "en";

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/65 hover:border-pine ${className}`}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={displayLocale}
        onChange={(event) => setLocale(event.target.value as SupportedLocale)}
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
