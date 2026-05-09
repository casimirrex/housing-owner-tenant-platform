"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { adminListUsers } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export default function AdminUsersPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", accessToken, search, role, page],
    queryFn: () =>
      adminListUsers({ search, role: role || undefined, page, pageSize: 20 }, accessToken ?? undefined),
    enabled: Boolean(accessToken)
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Users
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">All registered users</h2>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="field-label">
            Search
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                className="form-control pl-9"
                placeholder="Name or email…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </div>
          </label>
          <label className="field-label">
            Role
            <select
              className="form-control mt-2"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(0);
              }}
            >
              <option value="">All</option>
              <option value="TENANT">Tenant</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink/60">Loading users…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Failed to load users"}
        </p>
      ) : !data ? null : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-black/8 bg-white shadow-soft">
            <table className="min-w-full text-sm">
              <thead className="bg-canvas/60 text-xs uppercase tracking-wider text-ink/55">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.userId} className="border-t border-black/5">
                    <td className="px-4 py-3 font-semibold text-ink">
                      {user.fullName}
                      {user.verifiedOwner ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          ✓ Verified
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink/72">{user.email}</td>
                    <td className="px-4 py-3 text-ink/72">{user.phoneNumber || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-pine/10 px-2 py-0.5 text-xs font-bold text-pine">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/72">{user.city}</td>
                    <td className="px-4 py-3 text-xs text-ink/72">{user.profileStatus}</td>
                    <td className="px-4 py-3 text-xs text-ink/55">{user.updatedAt}</td>
                  </tr>
                ))}
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink/55">
                      No users match your filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink/65">
            <p>
              Showing {data.items.length} of {data.totalCount.toLocaleString("en-IN")} users
            </p>
            <div className="flex gap-2">
              <button
                className="button-ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                type="button"
              >
                Previous
              </button>
              <button
                className="button-ghost"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * data.pageSize >= data.totalCount}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
