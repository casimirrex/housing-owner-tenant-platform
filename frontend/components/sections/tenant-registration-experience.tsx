"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerWithEmail, registerWithPhone } from "@/lib/api/client";
import { GoogleIdentityButton } from "@/components/ui/google-identity-button";
import { loginWithGoogle } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Tenant-only registration experience for the dedicated /tenant/register page.
 * Implements UC-002 from the BRD. Locks the role to TENANT — owners are routed
 * to /owner/register instead (see FR-26 dual-role-email guard).
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

export function TenantRegistrationExperience() {
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

  const redirectToTenant = () => router.replace("/tenant/dashboard");

  const handleAuthError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Registration failed. Please try again.";
    // FR-26 — surface the dual-role-email block clearly when the backend
    // signals the email already exists under the OWNER role.
    if (/exists/i.test(message) && /owner/i.test(message)) {
      setPageError(
        "This email is already registered as an Owner. Please open the Owner sign-in page."
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
      // UC-018 — even though the backend may treat new accounts as TENANT by
      // default, we surface a helpful note if the backend assigned a different role.
      if (response.role && response.role !== "TENANT") {
        setPageNotice(
          "This email is already linked to an Owner account. Taking you to the Owner workspace…"
        );
        router.replace("/owner/dashboard");
        return;
      }
      setPageNotice("Tenant account created! Taking you to your dashboard…");
      redirectToTenant();
    },
    onError: handleAuthError
  });

  const phoneMutation = useMutation({
    mutationFn: (values: PhoneValues) => registerWithPhone(values),
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      if (response.role && response.role !== "TENANT") {
        router.replace("/owner/dashboard");
        return;
      }
      setPageNotice("Tenant account created! Taking you to your dashboard…");
      redirectToTenant();
    },
    onError: handleAuthError
  });

  const googleMutation = useMutation({
    mutationFn: (identityToken: string) => {
      const redirectUri =
        typeof window === "undefined"
          ? "http://127.0.0.1:3001/tenant/register"
          : `${window.location.origin}/tenant/register`;
      return loginWithGoogle({ identityToken, redirectUri });
    },
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      if (response.role && response.role !== "TENANT") {
        setStatusMessage(
          "This Google account is registered as an Owner. Taking you to the Owner workspace."
        );
        router.replace("/owner/dashboard");
        return;
      }
      redirectToTenant();
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
            <span className="eyebrow-pill">Tenant registration</span>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              Create your tenant account and start your search
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/78 md:text-lg">
              The tenant workspace lives at <code>/tenant/*</code>. Sign up
              here to discover homes, save shortlists, schedule visits, and pay
              rent — all in one renter-only flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-oat/78">
                Tenant workspace
              </span>
              <Link className="button-accent" href="/tenant/login">
                Already a tenant? Sign in
              </Link>
            </div>
          </div>

          <div className="relative z-10 dark-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/62">
              What you get
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-oat/76">
              <p>Search and shortlist properties published by owners.</p>
              <p>Schedule visits and track payments in your tenant dashboard.</p>
              <p>Sign-in is workspace-locked: tenants cannot access /owner/*.</p>
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
                    key: "email",
                    title: "Email + name",
                    detail: "Quickest path. Use your work or personal email."
                  },
                  {
                    key: "phone",
                    title: "Phone number",
                    detail: "OTP-based. Useful if you prefer SMS verification."
                  },
                  {
                    key: "google",
                    title: "Continue with Google",
                    detail: "One click via your Gmail account."
                  }
                ] as const
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
              Are you a property owner?
            </p>
            <p className="mt-3 text-sm leading-6 text-ink/74">
              Tenant accounts cannot list properties. If you want to publish a
              property, use the dedicated owner registration page.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="button-secondary" href="/owner/register">
                Open owner registration
              </Link>
              <Link className="button-secondary" href="/owner/login">
                Owner sign-in
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
            Tenant registration form
          </p>
          <h2 className="mt-3 font-serif text-3xl text-ink">
            Create your tenant account
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
                  placeholder="you@example.com"
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
                  ? "Creating tenant account…"
                  : "Create tenant account"}
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
                  ? "Creating tenant account…"
                  : "Create tenant account with phone"}
              </button>
            </form>
          ) : null}

          {method === "google" ? (
            <div className="mt-6 grid gap-5">
              <p className="text-sm leading-6 text-ink/72">
                One-tap signup using your Google account. We mark the resulting
                account as a tenant; if your Google email is already an Owner
                account, we will take you to the Owner workspace instead.
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
              Already have a tenant account?{" "}
              <Link className="font-semibold text-pine" href="/tenant/login">
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
