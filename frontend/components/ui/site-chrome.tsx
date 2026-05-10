"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { logoutSession } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { RoleSwitcher } from "@/components/ui/role-switcher";
import { CompareFloatingBar } from "@/components/ui/compare-floating-bar";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type NavItem = { href: string; labelKey: TranslationKey };

const guestNavItems: NavItem[] = [
  { href: "/search",           labelKey: "nav.search" },
  { href: "/cities/bengaluru", labelKey: "nav.cities" },
  { href: "/how-it-works",     labelKey: "nav.howItWorks" },
  { href: "/about",            labelKey: "nav.about" },
  { href: "/contact",          labelKey: "nav.support" },
];

function getSignedInNavItems(role?: string | null): NavItem[] {
  return [
    { href: "/search",           labelKey: "nav.search" },
    { href: "/cities/bengaluru", labelKey: "nav.cities" },
    { href: "/payments",         labelKey: "nav.payments" },
    { href: "/wallet",           labelKey: "nav.wallet" },
    {
      href: role === "OWNER" ? "/owner/dashboard" : "/tenant/dashboard",
      labelKey: "nav.dashboard",
    },
    { href: "/how-it-works", labelKey: "nav.howItWorks" },
    { href: "/about",        labelKey: "nav.about" },
    { href: "/contact",      labelKey: "nav.support" },
  ];
}

function getDisplayName(fullName?: string | null, email?: string | null) {
  const trimmedName = fullName?.trim();
  if (trimmedName) return trimmedName;

  const trimmedEmail = email?.trim();
  if (!trimmedEmail) return "Your account";

  const [localPart] = trimmedEmail.split("@");
  return localPart || trimmedEmail;
}

function getInitials(fullName?: string | null, email?: string | null) {
  const label = getDisplayName(fullName, email).trim();
  if (!label) return "RB";

  const parts = label.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return initials || label.slice(0, 2).toUpperCase();
}

function AccountAvatar({
  fullName,
  email,
  avatarUrl,
}: {
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => { setImageFailed(false); }, [avatarUrl]);

  const initials = getInitials(fullName, email);

  return (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-navy to-navy-light text-xs font-bold uppercase tracking-widest text-oat shadow-soft">
      {avatarUrl && !imageFailed ? (
        <Image
          alt={`${getDisplayName(fullName, email)} profile photo`}
          className="object-cover"
          fill
          onError={() => setImageFailed(true)}
          sizes="40px"
          src={avatarUrl}
        />
      ) : null}
      {(!avatarUrl || imageFailed) ? <span>{initials}</span> : null}
    </div>
  );
}

function HeaderAccountActions() {
  const router  = useRouter();
  const { session, clearSession, setStatusMessage } = useAuthStore();
  const { t } = useTranslation();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (!session) return null;
      return logoutSession({ refreshToken: session.refreshToken });
    },
    onSuccess: (response) => {
      clearSession(response?.message ?? "Signed out successfully.");
      router.replace("/");
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Logout failed.");
    },
  });

  if (!session) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link className="button-ghost px-4 py-2.5 text-sm" href="/owner/register">
            {t("auth.listYourProperty")}
          </Link>
          <Link className="button-ghost px-4 py-2.5 text-sm" href="/account/login">
            {t("auth.signIn")}
          </Link>
          <Link className="button-primary px-5 py-2.5 text-sm" href="/account/register">
            {t("auth.registration")}
          </Link>
        </div>
        {/* Mobile */}
        <div className="mt-4 grid gap-2.5 md:hidden">
          <Link className="button-ghost w-full justify-center" href="/owner/register">
            {t("auth.listYourProperty")}
          </Link>
          <div className="grid grid-cols-2 gap-2.5">
            <Link className="button-ghost justify-center" href="/account/login">
              {t("auth.signIn")}
            </Link>
            <Link className="button-primary justify-center" href="/account/register">
              {t("auth.registration")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const displayName   = getDisplayName(session.fullName, session.email);
  const accountLabel  =
    session.role === "OWNER"
      ? t("chrome.ownerAccount")
      : t("chrome.tenantAccount");
  const signingOut    = signOutMutation.isPending;
  const dashboardHref = session.role === "OWNER" ? "/owner/dashboard" : "/tenant/dashboard";
  const secondaryHref  = session.role === "OWNER" ? "/payments" : "/search";
  const secondaryLabel = session.role === "OWNER" ? t("chrome.collections") : t("nav.search");

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-2.5 md:flex">
        <Link
          className="flex items-center gap-3 rounded-xl border border-navy/14 bg-white/80 px-3 py-2 shadow-soft transition hover:border-navy/24 hover:bg-white hover:shadow-medium"
          href={dashboardHref}
          style={{ transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <AccountAvatar avatarUrl={session.avatarUrl} email={session.email} fullName={session.fullName} />
          <div className="min-w-0 text-left">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-copper">{accountLabel}</p>
            <p className="max-w-[10rem] truncate text-sm font-semibold text-ink">{displayName}</p>
          </div>
        </Link>
        <Link className="button-ghost px-4 py-2.5 text-sm" href={secondaryHref}>
          {secondaryLabel}
        </Link>
        <button
          className="button-primary px-5 py-2.5 text-sm"
          disabled={signingOut}
          onClick={() => signOutMutation.mutate()}
          type="button"
        >
          {signingOut ? `${t("nav.signOut")}…` : t("nav.signOut")}
        </button>
      </div>

      {/* Mobile */}
      <div className="mt-4 flex items-center justify-between gap-3 md:hidden">
        <Link
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-navy/12 bg-white/84 px-3 py-3 shadow-soft"
          href={dashboardHref}
        >
          <AccountAvatar avatarUrl={session.avatarUrl} email={session.email} fullName={session.fullName} />
          <div className="min-w-0">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-copper">{accountLabel}</p>
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
          </div>
        </Link>
        <button
          className="button-ghost whitespace-nowrap px-4 py-3 text-sm"
          disabled={signingOut}
          onClick={() => signOutMutation.mutate()}
          type="button"
        >
          {signingOut ? `${t("nav.signOut")}…` : t("nav.signOut")}
        </button>
      </div>
    </>
  );
}

/* ─── Site shell ─────────────────────────────────────────────────────────── */
export function SiteChrome({ children }: { children: ReactNode }) {
  const { session } = useAuthStore();
  const { t } = useTranslation();
  const navItems    = session ? getSignedInNavItems(session.role) : guestNavItems;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 px-4 py-4 md:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-black/6 bg-white/95 px-4 py-4 shadow-soft backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Link className="group flex items-center gap-3.5" href="/">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-xs font-bold uppercase tracking-[0.28em] text-oat">
                RB
              </div>
              <div>
                <p className="font-serif text-[1.65rem] font-semibold leading-none tracking-[-0.01em] text-navy">
                  Rent and Beyond
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.36em] text-ink/46">
                  {t("chrome.brandTagline")}
                </p>
              </div>
            </Link>

            <nav className="hidden flex-wrap items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <Link
                  className="rounded-lg px-4 py-2 text-[13px] font-medium text-ink/68 transition hover:bg-sand hover:text-navy"
                  href={item.href}
                  key={item.href}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <RoleSwitcher />
              <HeaderAccountActions />
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-0.5 lg:hidden">
            {navItems.map((item) => (
              <Link
                className="whitespace-nowrap rounded-full border border-black/6 bg-white px-4 py-2 text-[13px] font-medium text-ink/72"
                href={item.href}
                key={item.href}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}

      {/* Tier 2 #7 — floating compare bar (visible only when user has selected listings) */}
      <CompareFloatingBar />

      <footer className="px-4 pb-10 pt-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-black/6 bg-white/96 px-6 py-8 shadow-soft md:px-8">
            <div className="grid gap-8 md:grid-cols-[1.3fr_0.85fr_0.85fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-[10px] font-bold uppercase tracking-widest text-oat">
                    RB
                  </div>
                  <p className="font-serif text-xl font-semibold text-navy">Rent and Beyond</p>
                </div>
                <p className="mt-5 max-w-md font-serif text-2xl leading-snug text-ink md:text-[1.75rem]">
                  Trusted rentals for owners and tenants in one product.
                </p>
                <p className="mt-4 max-w-md text-sm leading-7 text-ink/68">
                  Discover homes, complete registration, manage listings, and handle payments with
                  a simpler rental journey.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link className="button-primary" href="/search">
                    Search homes
                  </Link>
                  <Link className="button-secondary" href="/owner/register">
                    List your home
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-ink/44">Explore</p>
                <div className="mt-4 space-y-2.5">
                  {[
                    { href: "/cities/bengaluru", label: "Bengaluru" },
                    { href: "/cities/pune", label: "Pune" },
                    { href: "/search", label: "Search" },
                    { href: "/account/onboarding", label: "Account setup" },
                    { href: "/payments", label: "Payments" },
                    { href: "/wallet", label: "Wallet" },
                  ].map((link) => (
                    <Link className="block text-sm text-ink/68 transition-colors hover:text-navy" href={link.href} key={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-ink/44">Account & support</p>
                <div className="mt-4 space-y-2.5">
                  {[
                    { href: "/account/login", label: "Sign in" },
                    { href: "/account/register", label: "Registration" },
                    { href: "/contact", label: "Contact support" },
                    { href: "/privacy-policy", label: "Privacy policy" },
                  ].map((link) => (
                    <Link className="block text-sm text-ink/68 transition-colors hover:text-navy" href={link.href} key={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/6 pt-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-ink/42">
                © {new Date().getFullYear()} Testition · All rights reserved
              </p>
              <p className="text-[11px] text-ink/46">
                Bengaluru · Pune · Hyderabad · Chennai · NCR-Delhi
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
