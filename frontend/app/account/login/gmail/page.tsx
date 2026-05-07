"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { GoogleIdentityButton } from "@/components/ui/google-identity-button";
import { loginWithGoogle } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Dedicated Gmail login route.
 *
 * Mirror of /account/register/gmail but for sign-in. Renders the Google
 * Identity button on a focused screen and redirects to the role-appropriate
 * dashboard on success.
 */
export default function AccountGmailLoginPage() {
  const router = useRouter();
  const { setSession, setStatusMessage } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const redirectUri =
    typeof window === "undefined"
      ? "http://127.0.0.1:3001/account/login/gmail"
      : `${window.location.origin}/account/login/gmail`;

  const googleMutation = useMutation({
    mutationFn: (identityToken: string) =>
      loginWithGoogle({ identityToken, redirectUri }),
    onSuccess: (response) => {
      setSession(response);
      setStatusMessage("Signed in with Google.");
      // Route to role-appropriate dashboard.
      if (response.role === "OWNER") {
        router.push("/owner/dashboard");
      } else {
        router.push("/account/onboarding");
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <section className="hero-panel px-8 py-10">
        <span className="eyebrow-pill">Gmail sign-in</span>
        <h1 className="mt-5 font-serif text-4xl text-oat md:text-5xl">
          Sign in with your Google account
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-oat/76">
          Pick the same Gmail account you used during registration. We&apos;ll restore your
          session in a single click.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-oat/66">
          <ShieldCheck className="h-4 w-4 text-pine" />
          <span>Verified email · No password to remember</span>
        </div>
      </section>

      <section className="section-panel mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Continue with Google
        </p>
        <div className="mt-5">
          <GoogleIdentityButton
            onCredential={(token) => googleMutation.mutate(token)}
            onError={(message) => setError(message)}
            text="continue_with"
          />
        </div>
        {googleMutation.isPending ? (
          <p className="mt-4 text-sm text-pine">Signing you in via Google...</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <p className="mt-6 text-sm text-ink/60">
          Prefer email and password instead?{" "}
          <Link className="font-semibold text-pine hover:text-navy" href="/account/login">
            Use the standard sign-in form
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-ink/60">
          New to the platform?{" "}
          <Link className="font-semibold text-pine hover:text-navy" href="/account/register">
            Create an account
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
