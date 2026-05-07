"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Plus, RefreshCw } from "lucide-react";
import { switchUserRole } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Bug F multi-role: header dropdown that lets a user switch between TENANT
 * and OWNER without signing out. Renders nothing when:
 *   - user is not signed in
 *   - user has < 2 available roles (only one workspace, nothing to switch)
 *
 * Clicking switch:
 *   1. POSTs /api/v1/auth/roles/switch with the chosen role
 *   2. Updates the local session store with the new active role
 *   3. Navigates to the role-appropriate dashboard
 *
 * Adding a missing role: a separate "Add X workspace" link routes to
 * /account/roles/add?role=OWNER (or TENANT) where the user can add it.
 */
export function RoleSwitcher() {
  const router = useRouter();
  const { session, setSession } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!session) return null;

  const available = session.availableRoles ?? [session.role];
  const activeRole = (session.role || "").toUpperCase();
  const allRoles: Array<"TENANT" | "OWNER"> = ["TENANT", "OWNER"];
  const missingRoles = allRoles.filter((r) => !available.includes(r));

  // If user has only one role AND no other role to add, hide the switcher entirely.
  if (available.length <= 1 && missingRoles.length === 0) return null;

  const handleSwitch = async (target: "TENANT" | "OWNER") => {
    if (target === activeRole || pending) return;
    setPending(true);
    try {
      const result = await switchUserRole(target, session.accessToken);
      // Update the local session with the new active role (and refreshed availableRoles)
      setSession({
        ...session,
        role: result.activeRole,
        availableRoles: result.availableRoles
      });
      setOpen(false);
      // Route to role-appropriate dashboard
      if (result.activeRole === "OWNER") {
        router.push("/owner/dashboard");
      } else {
        router.push("/search");
      }
    } catch (err) {
      // Surface error inline so the user knows something went wrong.
      // Console-level for now; future iteration can add a toast.
      console.error("Role switch failed:", err);
      alert(err instanceof Error ? err.message : "Could not switch role.");
    } finally {
      setPending(false);
    }
  };

  const formatRole = (r: string) => (r === "OWNER" ? "Owner" : "Tenant");

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {pending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
        <span>Acting as {formatRole(activeRole)}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-black/8 bg-white p-2 shadow-soft"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/45">
            Switch workspace
          </p>
          {available.map((r) => {
            const isActive = r === activeRole;
            return (
              <button
                key={r}
                type="button"
                role="menuitem"
                disabled={isActive || pending}
                onClick={() => handleSwitch(r as "TENANT" | "OWNER")}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-sand text-navy"
                    : "text-ink hover:bg-sand"
                } ${pending ? "opacity-60" : ""}`}
              >
                <span>{formatRole(r)} workspace</span>
                {isActive ? <span className="text-xs text-pine">Active</span> : null}
              </button>
            );
          })}

          {missingRoles.length > 0 ? (
            <>
              <hr className="my-2 border-black/8" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/45">
                Add workspace
              </p>
              {missingRoles.map((r) => (
                <Link
                  key={r}
                  href={`/account/roles/add?role=${r}`}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-sand"
                  onClick={() => setOpen(false)}
                >
                  <Plus className="h-4 w-4 text-copper" />
                  <span>Add {formatRole(r)} workspace</span>
                </Link>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
