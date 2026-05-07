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
 * Dedicated Gmail registration route.
 *
 * Rendered when a user clicks "Continue with Gmail" from onboarding or the
 * registration page. Keeps the Google flow on its own focused screen so
 * users see only the Google sign-in widget — no email/phone form clutter.
 *
 * The actual identity exchange goes through the same backend endpoint
 * (/auth/oauth/google) used by the inline button on /account/register.
 */
export default function AccountGmailRegisterPage() {
  const router = useRouter();
  const { setSession, setStatusMessage } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const redirectUri =
    typeof window === "undefined"
      ? "http://127.0.0.1:3001/account/register/gmail"
      : `${window.location.origin}/account/register/gmail`;

  const googleMutation = useMutation({
    mutationFn: (identityToken: string) =>
      loginWithGoogle({ identityToken, redirectUri, role: "TENANT" }),
    onSuccess: (response) => {
      setSession(response);
      setStatusMessage("Signed in with Google. Taking you to account setup.");
      router.push("/account/onboarding");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <section className="hero-panel px-8 py-10">
        <span className="eyebrow-pill">Gmail registration</span>
        <h1 className="mt-5 font-serif text-4xl text-oat md:text-5xl">
          Sign up with your Google account
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-oat/76">
          Choose a Gmail account and we&apos;ll create your tenant profile from your verified
          Google details — no separate password to remember.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-oat/66">
          <ShieldCheck className="h-4 w-4 text-pine" />
          <span>Verified email · No password to set</span>
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
            text="signup_with"
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
          <Link className="font-semibold text-pine hover:text-navy" href="/account/register">
            Use the standard registration form
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Already have an account?{" "}
          <Link className="font-semibold text-pine hover:text-navy" href="/account/login">
            Sign in
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
