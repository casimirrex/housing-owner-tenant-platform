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
 * Why the `mounted` flag: Zustand persist restores localStorage on the client
 * only. During SSR / static prerender there is no localStorage, so `session`
 * is null. If we redirected immediately we would briefly bounce a logged-in
 * admin to /tenant/login. We render a loading shell until the first client
 * effect fires, by which point persist has rehydrated.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!session) {
      router.replace("/tenant/login?redirect=/admin");
      return;
    }
    if (session.role !== "ADMIN") {
      router.replace("/");
    }
  }, [mounted, session, router]);

  if (!mounted || !session || session.role !== "ADMIN") {
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
