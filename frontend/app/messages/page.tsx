"use client";

import { Suspense } from "react";
import { MessagesExperience } from "./messages-experience";

/**
 * Tier 2 #6 — In-app chat (polling-based).
 * Outer page wraps in Suspense because the inner experience uses
 * useSearchParams (Next.js 14 build requirement).
 */
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="section-panel">
          <p className="text-sm text-ink/68">Loading messages…</p>
        </section>
      </main>
    }>
      <MessagesExperience />
    </Suspense>
  );
}
