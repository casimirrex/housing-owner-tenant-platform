"use client";

import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "testition-onboarding-tour-v1";

type Step = {
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to Testition",
    body:
      "Trust-first rentals — verified owners, transparent listings, no broker games. Here's a quick tour of what's new."
  },
  {
    title: "Search smarter",
    body:
      "Filter by BHK, budget, amenities, area, and how recently a listing was posted. Use the 📍 \"Use my location\" button to find homes near you."
  },
  {
    title: "Map view + clusters",
    body:
      "Zoom out to see neighbourhood clusters, zoom in to see individual rent pills. Click any pin for property details."
  },
  {
    title: "Notifications in one place",
    body:
      "Visit /account/notifications to see saved-search matches, maintenance updates, lead requests, and visit changes — all in one feed."
  },
  {
    title: "Verified-stay reviews",
    body:
      "Once your visit is marked completed, you can leave a review. The \"Verified stay\" badge tells future renters the review is real."
  },
  {
    title: "You're set",
    body:
      "Click around, save your favourites, schedule a visit. Welcome aboard."
  }
];

/**
 * Tier 3 — first-visit onboarding tour.
 *
 * Renders a small floating overlay with prev / next / skip controls. Anchors
 * itself to the bottom-right of the viewport so it never blocks search UI.
 * Once the user finishes (or dismisses), we set a localStorage flag so it
 * never shows again.
 *
 * The component opts itself out completely on the server / when localStorage
 * already has the flag, so it costs nothing for return visitors.
 */
export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "done") return;
      // Show after a short delay so the page paints first
      const timer = window.setTimeout(() => setVisible(true), 1500);
      return () => window.clearTimeout(timer);
    } catch {
      /* no localStorage available — silently do nothing */
    }
  }, []);

  if (!visible) return null;

  const finish = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* no-op */
    }
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed bottom-6 right-6 z-[1100] w-[min(92vw,360px)] rounded-2xl border border-black/8 bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pine">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Quick tour · {step + 1} / {STEPS.length}
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink">{current.title}</h3>
        </div>
        <button
          type="button"
          onClick={finish}
          className="rounded-full p-1 text-ink/40 hover:bg-black/5"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/72">{current.body}</p>

      <div className="mt-1 flex justify-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-5 rounded-full ${
              i === step ? "bg-pine" : i < step ? "bg-pine/40" : "bg-black/10"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65 transition hover:border-pine disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-1 rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-white"
          >
            Get started
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1 rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-white"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
