"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  registerWithEmail,
  registerWithPhone,
  loginWithGoogle
} from "@/lib/api/client";
import { GoogleIdentityButton } from "@/components/ui/google-identity-button";
import { GOOGLE_AUTH_ENABLED } from "@/lib/feature-flags";
import { useAuthStore } from "@/store/auth-store";

/**
 * Owner-only registration experience for the dedicated /owner/register page.
 * Implements UC-007. Locks the role intent to OWNER and routes successful
 * sign-ups directly into the owner dashboard. Tenants are redirected to
 * /tenant/register with FR-26 cross-workspace guidance.
 */

const emailSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address")
});

const phoneSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  countryCode: z.string().min(2, "Enter a country code"),
  phoneNumber: z.string().min(8, "Enter a valid phone number")
});

type EmailValues = z.infer<typeof emailSchema>;
type PhoneValues = z.infer<typeof phoneSchema>;

export function OwnerRegistrationExperience() {
  const router = useRouter();
  const { session, setSession, setStatusMessage } = useAuthStore();
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [method, setMethod] = useState<"email" | "phone" | "google">("email");

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { fullName: "", email: "" }
  });

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { fullName: "", countryCode: "+91", phoneNumber: "" }
  });

  const handleAuthError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Registration failed. Please try again.";
    if (/exists/i.test(message) && /tenant/i.test(message)) {
      setPageError(
        "This email is already registered as a Tenant. Please open the Tenant sign-in page."
      );
    } else {
      setPageError(message);
    }
  };

  const emailMutation = useMutation({
    mutationFn: (values: EmailValues) => registerWithEmail(values),
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      if (response.role && response.role !== "OWNER") {
        setPageNotice(
          "This email is already linked to a Tenant account. Taking you to the Tenant workspace…"
        );
        router.replace("/tenant/dashboard");
        return;
      }
      setPageNotice(
        "Owner account created! Taking you to your owner dashboard where you can add your first property…"
      );
      router.replace("/owner/dashboard");
    },
    onError: handleAuthError
  });

  const phoneMutation = useMutation({
    mutationFn: (values: PhoneValues) => registerWithPhone(values),
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      if (response.role && response.role !== "OWNER") {
        router.replace("/tenant/dashboard");
        return;
      }
      router.replace("/owner/dashboard");
    },
    onError: handleAuthError
  });

  const googleMutation = useMutation({
    mutationFn: (identityToken: string) => {
      const redirectUri =
        typeof window === "undefined"
          ? "http://127.0.0.1:3001/owner/register"
          : `${window.location.origin}/owner/register`;
      return loginWithGoogle({ identityToken, redirectUri });
    },
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      if (response.role && response.role !== "OWNER") {
        setStatusMessage(
          "This Google account is registered as a Tenant. Taking you to the Tenant workspace."
        );
        router.replace("/tenant/dashboard");
        return;
      }
      router.replace("/owner/dashboard");
    },
    onError: handleAuthError
  });

  const pending =
    emailMutation.isPending || phoneMutation.isPending || googleMutation.isPending;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.16fr_0.84fr] lg:items-end">
          <div className="relative z-10">
            <span className="eyebrow-pill">Owner registration</span>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              Create your owner account and publish your first property
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/78 md:text-lg">
              The owner workspace lives at <code>/owner/*</code>. Sign up here
              to add, list, edit, pause, and remove properties — and reach
              tenants through the shared tenant search index within seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-oat/78">
                Owner workspace
              </span>
              <Link className="button-accent" href="/owner/login">
                Already an owner? Sign in
              </Link>
            </div>
          </div>

          <div className="relative z-10 dark-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/62">
              What you get
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-oat/76">
              <p>Add and manage properties from the owner dashboard.</p>
              <p>List, edit, pause, and remove properties anytime.</p>
              <p>Published properties appear in tenant search within 30 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="grid gap-4">
          <div className="section-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Sign-up method
            </p>
            <div className="mt-4 grid gap-3">
              {(
                [
                  {
                    key: "email" as const,
                    title: "Email + name",
                    detail: "Quickest path. Use your business email."
                  },
                  {
                    key: "phone" as const,
                    title: "Phone number",
                    detail: "OTP-based verification."
                  },
                  ...(GOOGLE_AUTH_ENABLED
                    ? [{
                        key: "google" as const,
                        title: "Continue with Google",
                        detail: "One click via your Gmail account."
                      }]
                    : [])
                ]
              ).map((m) => (
                <button
                  className={`rounded-[28px] border p-4 text-left transition ${
                    method === m.key
                      ? "border-pine bg-pine text-oat shadow-soft"
                      : "border-white/70 bg-white/82 text-ink shadow-soft hover:border-pine/30"
                  }`}
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  type="button"
                >
                  <p className="text-lg font-semibold">{m.title}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      method === m.key ? "text-oat/80" : "text-ink/72"
                    }`}
                  >
                    {m.detail}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="soft-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Looking for a place to rent?
            </p>
            <p className="mt-3 text-sm leading-6 text-ink/74">
              Owner accounts cannot search and shortlist properties. Use the
              dedicated tenant registration page if you want to rent.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="button-secondary" href="/tenant/register">
                Open tenant registration
              </Link>
              <Link className="button-secondary" href="/tenant/login">
                Tenant sign-in
              </Link>
            </div>
          </div>

          {session ? (
            <div className="soft-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
                Already signed in
              </p>
              <p className="mt-3 text-sm leading-6 text-ink/74">
                You are signed in as{" "}
                <span className="font-semibold text-ink">
                  {session.email ?? session.fullName ?? "the current account"}
                </span>{" "}
                (role: {session.role ?? "unknown"}).
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="button-secondary"
                  href={
                    session.role === "OWNER"
                      ? "/owner/dashboard"
                      : "/tenant/dashboard"
                  }
                >
                  Go to my dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="section-panel self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Owner registration form
          </p>
          <h2 className="mt-3 font-serif text-3xl text-ink">
            Create your owner account
          </h2>

          {method === "email" ? (
            <form
              className="mt-6 grid gap-5"
              onSubmit={emailForm.handleSubmit((values) =>
                emailMutation.mutate(values)
              )}
            >
              <label className="field-label">
                Full name
                <input
                  className="form-control mt-2"
                  placeholder="Enter your full name"
                  {...emailForm.register("fullName")}
                />
                <span className="mt-2 block text-xs text-copper">
                  {emailForm.formState.errors.fullName?.message}
                </span>
              </label>
              <label className="field-label">
                Email address
                <input
                  className="form-control mt-2"
                  placeholder="owner@example.com"
                  {...emailForm.register("email")}
                />
                <span className="mt-2 block text-xs text-copper">
                  {emailForm.formState.errors.email?.message}
                </span>
              </label>
              <button
                className="button-primary"
                disabled={pending}
                type="submit"
              >
                {emailMutation.isPending
                  ? "Creating owner account…"
                  : "Create owner account"}
              </button>
            </form>
          ) : null}

          {method === "phone" ? (
            <form
              className="mt-6 grid gap-5"
              onSubmit={phoneForm.handleSubmit((values) =>
                phoneMutation.mutate(values)
              )}
            >
              <label className="field-label">
                Full name
                <input
                  className="form-control mt-2"
                  placeholder="Enter your full name"
                  {...phoneForm.register("fullName")}
                />
                <span className="mt-2 block text-xs text-copper">
                  {phoneForm.formState.errors.fullName?.message}
                </span>
              </label>
              <div className="grid gap-5 sm:grid-cols-[0.34fr_0.66fr]">
                <label className="field-label">
                  Country code
                  <input
                    className="form-control mt-2"
                    placeholder="+91"
                    {...phoneForm.register("countryCode")}
                  />
                  <span className="mt-2 block text-xs text-copper">
                    {phoneForm.formState.errors.countryCode?.message}
                  </span>
                </label>
                <label className="field-label">
                  Phone number
                  <input
                    className="form-control mt-2"
                    placeholder="Enter your phone number"
                    {...phoneForm.register("phoneNumber")}
                  />
                  <span className="mt-2 block text-xs text-copper">
                    {phoneForm.formState.errors.phoneNumber?.message}
                  </span>
                </label>
              </div>
              <button
                className="button-primary"
                disabled={pending}
                type="submit"
              >
                {phoneMutation.isPending
                  ? "Creating owner account…"
                  : "Create owner account with phone"}
              </button>
            </form>
          ) : null}

          {GOOGLE_AUTH_ENABLED && method === "google" ? (
            <div className="mt-6 grid gap-5">
              <p className="text-sm leading-6 text-ink/72">
                One-tap signup using your Google account. If your Google email
                is already a Tenant account, we will take you to the Tenant
                workspace instead — one email maps to one role.
              </p>
              <GoogleIdentityButton
                onCredential={(token) => googleMutation.mutate(token)}
                onError={(message) => setPageError(message)}
                text="signup_with"
              />
              {googleMutation.isPending ? (
                <p className="text-sm text-pine">Verifying your Google account…</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {pageNotice ? (
              <p className="rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">
                {pageNotice}
              </p>
            ) : null}
            {pageError ? (
              <p className="rounded-2xl bg-copper/10 px-4 py-3 text-sm text-copper">
                {pageError}
              </p>
            ) : null}
            <p className="text-sm leading-6 text-ink/70">
              Already have an owner account?{" "}
              <Link className="font-semibold text-pine" href="/owner/login">
                Sign in here
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
