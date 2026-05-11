"use client";

import { useEffect } from "react";

// Define the init callback on window via a typed alias. We don't redeclare
// `window.google` here because google-identity-button.tsx already declares
// it for the Sign-in-with-Google SDK — duplicate declarations would clash.
// At runtime we just reach for `window.google.translate` via a cast.
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
}

type GoogleTranslateGlobal = {
  translate?: {
    TranslateElement: new (
      options: Record<string, unknown>,
      elementId: string
    ) => unknown;
  };
};

/**
 * Loads Google Translate's free Website Translator widget and initializes
 * it in a hidden mount point. We don't show its UI — our own
 * LocaleSwitcher writes the `googtrans` cookie and reloads, which Google's
 * script then picks up and applies to every text node on the page.
 *
 * Why this exists: maintaining a hand-rolled dictionary that covers every
 * string across 30+ pages and dynamic content (listing titles, owner
 * messages, error toasts) was never going to reach 100%. The widget
 * translates the entire DOM automatically, including content rendered
 * after the initial page load.
 *
 * Trade-offs:
 *   - Third-party Google service. Could be deprecated someday (still
 *     working as of 2026).
 *   - Machine-translated quality. Acceptable for an early-stage product;
 *     swap to professional human translations later if needed.
 *   - One extra script load (~30 KB).
 */
export function GoogleTranslateInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // The script calls this on load — declared on window first so it
    // always exists by the time the script invokes it.
    window.googleTranslateElementInit = () => {
      const g = (window as unknown as { google?: GoogleTranslateGlobal }).google?.translate;
      if (!g) return;
      try {
        new g.TranslateElement(
          {
            pageLanguage: "en",
            // Supported target languages we expose in our LocaleSwitcher.
            includedLanguages: "hi,kn,ta",
            // Hide Google's banner — we provide our own LocaleSwitcher.
            autoDisplay: false
          },
          "google_translate_element"
        );
      } catch (err) {
        console.warn("[google-translate] init failed", err);
      }
    };

    // Avoid double-loading the script on client-side route changes.
    if (!document.getElementById("gtranslate-script")) {
      const script = document.createElement("script");
      script.id = "gtranslate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      id="google_translate_element"
      aria-hidden
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        height: 0,
        width: 0,
        overflow: "hidden",
        visibility: "hidden"
      }}
    />
  );
}
