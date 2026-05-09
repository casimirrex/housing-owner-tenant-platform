"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Flag,
  Home,
  ShieldCheck,
  Users
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

/**
 * /admin/* layout — gates the entire admin section behind the ADMIN role.
 * Non-admin sessions are redirected to /. Backend re-checks every endpoint,
 * so this is only a UX gate.
 *
 * Hydration: Zustand persist restores localStorage asynchronously after the
 * first client render. We wait for the persist callback before deciding
 * whether to redirect, otherwise a logged-in admin would briefly see no
 * session and get bounced to /tenant/login.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const [hasHydrated, setHasHydrated] = useState<boolean>(
    () => useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session) {
      router.replace("/tenant/login?redirect=/admin");
      return;
    }
    if (session.role !== "ADMIN") {
      router.replace("/");
    }
  }, [hasHydrated, session, router]);

  if (!hasHydrated || !session || session.role !== "ADMIN") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6 py-16 text-center">
        <p className="text-sm text-ink/60">Checking admin access…</p>
      </main>
    );
  }

  const navItems = [
    { href: "/admin", label: "Overview", icon: BarChart3 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/listings", label: "Listings", icon: Home },
    { href: "/admin/reports", label: "Reports", icon: Flag }
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
            <ShieldCheck className="mr-2 inline h-4 w-4" />
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Operations console</h1>
          <p className="mt-1 text-sm text-ink/60">
            Signed in as <span className="font-semibold text-ink">{session.fullName ?? session.email}</span>
          </p>
        </div>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-black/8 pb-2">
        {navItems.map((item) => {
          const active = pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-pine text-white"
                  : "bg-white text-ink/70 border border-black/8 hover:border-pine hover:text-pine"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </main>
  );
}
