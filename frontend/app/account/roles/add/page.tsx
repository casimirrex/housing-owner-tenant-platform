"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Crown, Home, ShieldCheck, Sparkles } from "lucide-react";
import { addUserRole, switchUserRole } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Bug F multi-role: dedicated page for adding a second workspace
 * (TENANT or OWNER) to the currently signed-in account.
 *
 * Flow:
 *  1. User on a TENANT account clicks "Add Owner workspace" in the header.
 *  2. Lands here with ?role=OWNER. Sees a clear explainer + Confirm button.
 *  3. POST /api/v1/auth/roles/add — adds the role to user_roles.
 *  4. POST /api/v1/auth/roles/switch — sets it as the active role on the session.
 *  5. Updates the local session store + redirects to the role-appropriate
 *     onboarding/dashboard page.
 */

const ROLE_INFO: Record<"TENANT" | "OWNER", {
  title: string;
  body: string;
  benefits: string[];
  primaryDest: string;
  primaryLabel: string;
}> = {
  TENANT: {
    title: "Add Tenant workspace",
    body: "Search rentals, save matches, book visits, and pay rent — all from the same account.",
    benefits: [
      "Search verified properties across all launch cities",
      "Save shortlists and book property visits",
      "Pay deposits and monthly rent in one place"
    ],
    primaryDest: "/search",
    primaryLabel: "Start searching"
  },
  OWNER: {
    title: "Add Owner workspace",
    body: "Publish properties, manage tenant payments, and monitor your inventory — all under one login.",
    benefits: [
      "Publish properties with photos, rent, and amenities",
      "Track active and draft listings in one dashboard",
      "Assign rent / deposit payments to tenants and reconcile receipts"
    ],
    primaryDest: "/owner/listings/new",
    primaryLabel: "Add your first property"
  }
};

export default function AddRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, setSession, setStatusMessage } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const requestedRoleRaw = searchParams.get("role")?.toUpperCase() ?? "";
  const requestedRole: "TENANT" | "OWNER" | null =
    requestedRoleRaw === "TENANT" || requestedRoleRaw === "OWNER" ? requestedRoleRaw : null;

  const addAndSwitchMutation = useMutation({
    mutationFn: async (role: "TENANT" | "OWNER") => {
      // Step 1: add the role (idempotent — safe if it already exists).
      await addUserRole(role, session?.accessToken);
      // Step 2: switch active role to it. Returns updated availableRoles + activeRole.
      return switchUserRole(role, session?.accessToken);
    },
    onSuccess: (result) => {
      if (!session) return;
      setSession({
        ...session,
        role: result.activeRole,
        availableRoles: result.availableRoles
      });
      setStatusMessage(`${ROLE_INFO[result.activeRole as "TENANT" | "OWNER"].title} added.`);
      const dest = ROLE_INFO[result.activeRole as "TENANT" | "OWNER"]?.primaryDest ?? "/";
      router.push(dest);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not add the workspace.");
    }
  });

  /* ── Unauthenticated ─────────────────────────────────────────────────── */
  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <section className="hero-panel px-8 py-10">
          <span className="eyebrow-pill">Add workspace</span>
          <h1 className="mt-5 font-serif text-4xl text-oat md:text-5xl">
            Sign in to add another workspace
          </h1>
          <p className="mt-4 text-base leading-7 text-oat/76">
            Adding a workspace links it to your existing account so you can switch between roles
            without creating a new login.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-accent" href="/account/login">Sign in</Link>
            <Link className="button-secondary" href="/account/register">Create account</Link>
          </div>
        </section>
      </main>
    );
  }

  /* ── Invalid / missing role param ────────────────────────────────────── */
  if (!requestedRole) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Add workspace</p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Pick the workspace to add</h1>
          <p className="mt-4 text-sm leading-6 text-ink/68">
            We need to know whether you want to add a Tenant workspace or an Owner workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href="/account/roles/add?role=TENANT">
              <Home className="h-4 w-4" /> Add Tenant workspace
            </Link>
            <Link className="button-secondary" href="/account/roles/add?role=OWNER">
              <Crown className="h-4 w-4" /> Add Owner workspace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const available = session.availableRoles ?? [session.role];
  const alreadyHas = available.includes(requestedRole);
  const info = ROLE_INFO[requestedRole];
  const Icon = requestedRole === "OWNER" ? Crown : Home;

  /* ── Already has the role ────────────────────────────────────────────── */
  if (alreadyHas && session.role !== requestedRole) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Already added</p>
          <h1 className="mt-3 font-serif text-3xl text-ink">
            {info.title.replace("Add ", "")} is already linked to your account
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink/68">
            Use the workspace switcher in the top-right to jump between Tenant and Owner without
            adding it again.
          </p>
          <div className="mt-6">
            <Link className="button-primary" href={info.primaryDest}>{info.primaryLabel}</Link>
          </div>
        </section>
      </main>
    );
  }
  if (alreadyHas && session.role === requestedRole) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <section className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Active workspace</p>
          <h1 className="mt-3 font-serif text-3xl text-ink">
            You&apos;re already in the {requestedRole === "OWNER" ? "Owner" : "Tenant"} workspace
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink/68">
            Nothing to add — this workspace is already active on your session.
          </p>
          <div className="mt-6">
            <Link className="button-primary" href={info.primaryDest}>{info.primaryLabel}</Link>
          </div>
        </section>
      </main>
    );
  }

  /* ── Confirm + add ───────────────────────────────────────────────────── */
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <section className="hero-panel px-8 py-10">
        <span className="eyebrow-pill">Add workspace</span>
        <div className="mt-5 flex items-center gap-3">
          <Icon className="h-7 w-7 text-amber-400" />
          <h1 className="font-serif text-4xl text-oat md:text-5xl">{info.title}</h1>
        </div>
        <p className="mt-4 max-w-xl text-base leading-7 text-oat/76">{info.body}</p>
      </section>

      <section className="section-panel mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          What you&apos;ll be able to do
        </p>
        <ul className="mt-4 space-y-3">
          {info.benefits.map((benefit) => (
            <li className="flex gap-3 text-sm leading-6 text-ink/72" key={benefit}>
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-2 text-xs text-ink/56">
          <ShieldCheck className="h-4 w-4 text-pine" />
          <span>You stay signed in as the same user — no separate password.</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="button-primary"
            disabled={addAndSwitchMutation.isPending}
            onClick={() => addAndSwitchMutation.mutate(requestedRole)}
            type="button"
          >
            {addAndSwitchMutation.isPending ? "Adding..." : `Add and switch to ${requestedRole === "OWNER" ? "Owner" : "Tenant"}`}
          </button>
          <Link className="button-secondary" href="/">Cancel</Link>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
