"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

type RequiredRole = "OWNER" | "TENANT";

/**
 * Client-side role gatekeeper for workspace pages.
 *
 * Implements UC-018 (cross-workspace access attempt) and FR-07/FR-27 from the BRD.
 *
 * Behaviour:
 *   - Not signed in           -> renders an inline "sign in to continue" panel that links
 *                                to the workspace's dedicated login page.
 *   - Signed in, wrong role   -> renders an inline notice and routes the user to the
 *                                correct workspace dashboard after a short delay.
 *   - Signed in, correct role -> renders {children}.
 *
 * NOTE: This is a defence-in-depth client guard only. Session tokens live in
 * localStorage (existing auth-store), so true edge middleware cannot inspect them
 * without a storage refactor. Backend endpoints already enforce role at the API
 * layer; this component prevents accidental UI access and offers a clean redirect.
 */
export function RoleGuard({
  required,
  children
}: {
  required: RequiredRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Auto-redirect when role mismatch is detected.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (session && session.role !== required) {
      const target =
        session.role === "OWNER" ? "/owner/dashboard" : "/tenant/dashboard";
      const timer = setTimeout(() => router.replace(target), 1800);
      return () => clearTimeout(timer);
    }
  }, [hydrated, session, required, router]);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="section-panel">
          <p className="text-sm text-ink/72">Loading workspace…</p>
        </div>
      </main>
    );
  }

  if (!session) {
    const loginHref = required === "OWNER" ? "/owner/login" : "/tenant/login";
    const registerHref =
      required === "OWNER" ? "/owner/register" : "/tenant/register";
    const workspaceLabel = required === "OWNER" ? "Owner" : "Tenant";
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            {workspaceLabel} workspace
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">
            Sign in to continue to the {workspaceLabel.toLowerCase()} workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            This area is only available once you are signed in as a{" "}
            {workspaceLabel.toLowerCase()}. Use the{" "}
            {workspaceLabel.toLowerCase()} sign-in page below, or create a new
            {workspaceLabel.toLowerCase()} account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href={loginHref}>
              Open {workspaceLabel.toLowerCase()} sign-in
            </Link>
            <Link className="button-secondary" href={registerHref}>
              Create a {workspaceLabel.toLowerCase()} account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (session.role !== required) {
    const otherWorkspaceLabel = session.role === "OWNER" ? "owner" : "tenant";
    const correctDashboard =
      session.role === "OWNER" ? "/owner/dashboard" : "/tenant/dashboard";
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Wrong workspace
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">
            This area is only available to{" "}
            {required === "OWNER" ? "owners" : "tenants"}.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            You are signed in as a{otherWorkspaceLabel === "owner" ? "n " : " "}
            {otherWorkspaceLabel}. Taking you back to your{" "}
            {otherWorkspaceLabel} dashboard…
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href={correctDashboard}>
              Go to my {otherWorkspaceLabel} dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
