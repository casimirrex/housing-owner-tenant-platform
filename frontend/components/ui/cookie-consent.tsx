"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "testition-cookie-consent-v1";

type ConsentValue = "accepted" | "essential-only";

/**
 * Phase 1 — DPDP / GDPR-style cookie consent banner.
 *
 * Renders a slide-in bar at the bottom of the viewport on first visit.
 * Stores the choice in localStorage so it never reappears unless the user
 * clears their browser data. Two options:
 *   - "Accept all"           → analytics + functional cookies allowed
 *   - "Essential only"       → only auth/session cookies kept
 *
 * The banner does NOT actually toggle any third-party scripts (we have
 * none yet); it documents user intent so we can wire that later. The
 * stored value is read by analytics components in future PRs to decide
 * whether to fire.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      // Show after a short delay so the page paints first
      const timer = window.setTimeout(() => setVisible(true), 800);
      return () => window.clearTimeout(timer);
    } catch {
      /* no localStorage — silently skip */
    }
  }, []);

  const persist = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, decidedAt: new Date().toISOString() })
      );
    } catch {
      /* no-op */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-4 left-1/2 z-[1200] w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl border border-black/8 bg-white p-5 shadow-2xl"
      data-no-translate="false"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
          <Cookie className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id="cookie-consent-title"
            className="text-sm font-semibold text-ink"
          >
            We use cookies to keep you signed in and improve the experience
          </h3>
          <p className="mt-1 text-xs leading-5 text-ink/65">
            Essential cookies (auth + session) are required for the site to
            work. Analytics cookies are optional and help us improve. Read our{" "}
            <Link
              className="font-semibold text-pine hover:underline"
              href="/privacy-policy"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => persist("essential-only")}
          aria-label="Dismiss"
          className="rounded-full p-1 text-ink/40 hover:bg-black/5 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => persist("essential-only")}
          className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-pine hover:text-pine"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => persist("accepted")}
          className="rounded-full bg-pine px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-pine/90"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}

/**
 * Helper for analytics components: returns whether the user has accepted
 * full cookies. Defaults to false during SSR / before consent is given.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { value?: ConsentValue };
    return parsed.value === "accepted";
  } catch {
    return false;
  }
}
