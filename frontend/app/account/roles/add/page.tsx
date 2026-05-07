"use client";

import { Suspense } from "react";
import { AddRoleExperience } from "./add-role-experience";

/**
 * Bug F multi-role: dedicated page for adding a second workspace
 * (TENANT or OWNER) to the currently signed-in account.
 *
 * Wrapped in Suspense because the inner experience uses useSearchParams,
 * which Next.js 14 requires to be inside a Suspense boundary at build time.
 */
export default function AddRolePage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-2xl px-6 py-16">
        <section className="section-panel">
          <p className="text-sm text-ink/68">Loading…</p>
        </section>
      </main>
    }>
      <AddRoleExperience />
    </Suspense>
  );
}
