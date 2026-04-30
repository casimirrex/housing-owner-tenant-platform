"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { logoutSession } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export function LogoutExperience({
  returnHref
}: {
  returnHref: string | null;
}) {
  const router = useRouter();
  const { session, statusMessage, clearSession, setStatusMessage } = useAuthStore();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("There is no active session to sign out.");
      }

      return logoutSession({ refreshToken: session.refreshToken });
    },
    onSuccess: (response) => {
      clearSession(response.message);
      router.replace("/");
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Logout failed.");
    }
  });

  useEffect(() => {
    if (!session) {
      router.replace("/");
      return;
    }

    if (!logoutMutation.isPending && !logoutMutation.isSuccess) {
      logoutMutation.mutate();
    }
  }, [logoutMutation, router, session]);

  return (
    <div className="grid gap-6">
      <div className="section-panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper">
              Session sign-out
            </p>
            <h3 className="mt-3 font-serif text-3xl text-ink">Explicit logout for the web app</h3>
          </div>
          <span className="rounded-full bg-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-copper">
            Account control
          </span>
        </div>

        <div className="soft-panel mt-8">
          {session ? (
            <div className="grid gap-2 text-sm text-ink/78">
              <p>
                <span className="font-semibold text-ink">Signed in user:</span> {session.userId}
              </p>
              <p>
                <span className="font-semibold text-ink">Auth method:</span> {session.authMethod}
              </p>
              <p>
                <span className="font-semibold text-ink">Refresh token:</span>{" "}
                {session.refreshToken.slice(0, 18)}...
              </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-ink/72">
              No active session is stored in the browser right now. Visit the login page first if
              you want to sign out from a real session.
            </p>
          )}

          {statusMessage ? (
            <p className="mt-4 rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">
              {statusMessage}
            </p>
          ) : null}

          {logoutMutation.error ? (
            <p className="mt-4 rounded-2xl bg-copper/10 px-4 py-3 text-sm text-copper">
              Logout did not complete. Please try again and make sure your session is still active.
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="button-accent"
            disabled={!session || logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            type="button"
          >
            {logoutMutation.isPending ? "Signing out..." : "Logout now"}
          </button>
          {returnHref ? (
            <Link className="button-secondary" href={returnHref}>
              Return to login
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            What this does
          </p>
          <p className="mt-3 text-lg font-semibold text-ink">Ends the active session cleanly</p>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            Clears the local session and confirms that the current browser session is finished.
          </p>
        </div>
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Why it matters
          </p>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            Sign-out should feel intentional, especially when someone is using a shared computer or
            handing the session back later.
          </p>
        </div>
      </div>
    </div>
  );
}
