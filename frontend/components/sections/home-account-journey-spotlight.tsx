"use client";

import Link from "next/link";
import { Building2, Compass, Wallet } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function HomeAccountJourneySpotlight() {
  const { session } = useAuthStore();

  if (!session) {
    return null;
  }

  const cards =
    session.role === "OWNER"
      ? [
          {
            href: "/owner/dashboard",
            title: "Manage listings",
            body: "Create and review listing drafts, then keep inventory moving into discovery.",
            icon: Building2
          },
          {
            href: "/payments",
            title: "Review collections",
            body: "See what tenants have paid already and which amounts still need attention.",
            icon: Wallet
          },
          {
            href: "/search",
            title: "Experience the public funnel",
            body: "Check how your homes sit inside the wider search and trust-first discovery flow.",
            icon: Compass
          }
        ]
      : [
          {
            href: "/tenant/dashboard",
            title: "Open your dashboard",
            body: "Matches, visits, and renter readiness are now grouped in one signed-in dashboard.",
            icon: Compass
          },
          {
            href: "/payments",
            title: "Handle payments",
            body: "Pay booking, deposit, or rent dues and keep the full payment trail in one place.",
            icon: Wallet
          },
          {
            href: "/account/onboarding",
            title: "Finish account setup",
            body: "Keep profile details, verification readiness, and preferences polished before applying.",
            icon: Building2
          }
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-6">
      <div className="section-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Signed-in workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {session.role === "OWNER"
                ? "Owner listings, collections, and public discovery now live in one app"
                : "Tenant discovery, onboarding, and payments now stay connected"}
            </h2>
          </div>
          <span className="rounded-full bg-pine/10 px-4 py-2 text-sm font-semibold text-pine">
            {session.role === "OWNER" ? "Owner workspace" : "Tenant workspace"}
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              className="rounded-[28px] border border-black/8 bg-white/88 p-5 shadow-soft transition hover:border-pine/22 hover:bg-white"
              href={card.href}
              key={card.href}
            >
              <card.icon className="h-5 w-5 text-copper" />
              <h3 className="mt-4 text-xl font-semibold text-ink">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/72">{card.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
