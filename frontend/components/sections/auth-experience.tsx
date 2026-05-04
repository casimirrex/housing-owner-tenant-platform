"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  login,
  loginWithApple,
  loginWithGoogle,
  logoutSession,
  refreshSession
} from "@/lib/api/client";
import { GoogleIdentityButton } from "@/components/ui/google-identity-button";
import { GOOGLE_AUTH_ENABLED } from "@/lib/feature-flags";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone number"),
  password: z.string().min(8, "Enter a password with at least 8 characters")
});

type LoginValues = z.infer<typeof loginSchema>;
type RoleIntent = "OWNER" | "TENANT";

const authScopeItems = [
  {
    title: "Google Sign-In / Gmail Login",
    status: "Included",
    detail: "Explicitly supported in the PRD alongside phone and email registration."
  },
  {
    title: "Logout / Session Sign-Out",
    status: "Added to web scope",
    detail: "Included as a standard part of the browser account experience."
  },
  {
    title: "OTP verification or change number",
    status: "Included",
    detail: "Still part of the broader registration and account recovery journey."
  }
];

export function AuthExperience({
  authPath = "/login",
  googleHref,
  onboardingHref = "/onboarding",
  signupHref = "/signup",
  roleIntent,
  ownerLoginHref = "/owner/login",
  ownerSetupHref = "/list-your-home",
  tenantLoginHref = "/tenant/login"
}: {
  authPath?: string;
  googleHref?: string;
  onboardingHref?: string;
  signupHref?: string;
  roleIntent?: RoleIntent;
  ownerLoginHref?: string;
  ownerSetupHref?: string;
  tenantLoginHref?: string;
}) {
  const router = useRouter();
  const { session, statusMessage, setSession, clearSession, setStatusMessage } = useAuthStore();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: ""
    }
  });

  const redirectUri =
    typeof window === "undefined"
      ? `http://127.0.0.1:3001${authPath}`
      : `${window.location.origin}${authPath}`;
  const isOwnerIntent = roleIntent === "OWNER";
  const isTenantIntent = roleIntent === "TENANT";

  const redirectAfterAuth = (nextSession: { role: string }) => {
    if (nextSession.role === "OWNER") {
      router.replace("/owner/dashboard");
      return;
    }

    router.replace("/");
  };

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => login({ ...values, roleHint: roleIntent }),
    onSuccess: (nextSession) => {
      setSession(nextSession);
      form.reset({
        identifier: form.getValues("identifier"),
        password: ""
      });
      redirectAfterAuth(nextSession);
    }
  });

  const googleMutation = useMutation({
    mutationFn: (identityToken: string) =>
      loginWithGoogle({
        identityToken,
        redirectUri
      }),
    onSuccess: (nextSession) => {
      setSession(nextSession);
      redirectAfterAuth(nextSession);
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  });

  const appleMutation = useMutation({
    mutationFn: () =>
      loginWithApple({
        authorizationCode: "apple_demo_code",
        redirectUri
      }),
    onSuccess: (nextSession) => {
      setSession(nextSession);
      redirectAfterAuth(nextSession);
    }
  });

  const refreshMutation = useMutation({
    mutationFn: () => {
      if (!session) {
        throw new Error("Log in first to refresh the active session.");
      }

      return refreshSession({ refreshToken: session.refreshToken });
    },
    onSuccess: (nextSession) => setSession(nextSession),
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Refresh failed.");
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      if (!session) {
        throw new Error("No active session is available to sign out.");
      }

      return logoutSession({ refreshToken: session.refreshToken });
    },
    onSuccess: (response) => clearSession(response.message),
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Logout failed.");
    }
  });

  const onSubmit = form.handleSubmit((values) => loginMutation.mutate(values));

  const pending =
    loginMutation.isPending ||
    googleMutation.isPending ||
    appleMutation.isPending ||
    refreshMutation.isPending ||
    logoutMutation.isPending;
  const accountLabel = isOwnerIntent ? "Owner access" : "Tenant access";
  const headline = isOwnerIntent
    ? "Sign in to your owner dashboard"
    : isTenantIntent
      ? "Sign in to continue as a renter"
      : "Sign in with the method that fits the moment";
  const identifierLabel = isOwnerIntent ? "Owner email or phone" : "Email or phone";
  const primaryButtonLabel = isOwnerIntent ? "Sign in to owner dashboard" : "Login with email / phone";
  const sessionEmptyLabel = isOwnerIntent
    ? "No active owner session yet. Use the owner account you created from the property setup flow."
    : "No active session yet. Use email, phone, or Gmail to sign in, then manage refresh and sign-out here.";
  const bottomPrimaryHref = isOwnerIntent ? ownerSetupHref : signupHref;
  const bottomPrimaryLabel = isOwnerIntent ? "Create owner account" : "Open registration page";
  const bottomSecondaryHref = isOwnerIntent ? tenantLoginHref : ownerLoginHref;
  const bottomSecondaryLabel = isOwnerIntent ? "Need renter sign-in?" : "Need owner sign-in?";

  return (
    <div className="grid gap-10">
      <form
        className="section-panel"
        onSubmit={onSubmit}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper">
              {accountLabel}
            </p>
            <h3 className="mt-3 font-serif text-3xl text-ink">{headline}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/72">
              {isOwnerIntent
                ? "Owner accounts manage listings, payments, and publishing. Use the owner account created from List your home."
                : isTenantIntent
                  ? "Tenant accounts keep discovery, saved homes, onboarding, visits, and payments in one renter flow."
                  : "Use the sign-in path that matches what you want to do next: renter discovery or owner listing management."}
            </p>
          </div>
          <span className="rounded-full bg-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-copper">
            {isOwnerIntent ? "Owner dashboard" : "Browser-first flow"}
          </span>
        </div>

        {!roleIntent ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link className="soft-panel hover:border-pine/30" href={tenantLoginHref}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Renter sign-in</p>
              <p className="mt-2 text-lg font-semibold text-ink">Browse homes, visits, and payments</p>
              <p className="mt-2 text-sm leading-6 text-ink/72">
                Use the renter path if you are searching for a home or continuing profile setup.
              </p>
            </Link>
            <Link className="soft-panel hover:border-pine/30" href={ownerLoginHref}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Owner sign-in</p>
              <p className="mt-2 text-lg font-semibold text-ink">Manage listings and collections</p>
              <p className="mt-2 text-sm leading-6 text-ink/72">
                Use the owner path if you want to add properties and track tenant payments.
              </p>
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-secondary" href={bottomSecondaryHref}>
              {bottomSecondaryLabel}
            </Link>
            {isOwnerIntent ? (
              <Link className="button-secondary" href={ownerSetupHref}>
                Create owner account
              </Link>
            ) : (
              <Link className="button-secondary" href={signupHref}>
                Need a renter account?
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-5">
          <label className="field-label">
            {identifierLabel}
            <input className="form-control mt-2" {...form.register("identifier")} />
            <span className="mt-2 block text-xs text-copper">
              {form.formState.errors.identifier?.message}
            </span>
          </label>

          <label className="field-label">
            Password
            <input className="form-control mt-2" type="password" {...form.register("password")} />
            <span className="mt-2 block text-xs text-copper">
              {form.formState.errors.password?.message}
            </span>
          </label>

          <div className="grid gap-4">
            <div className={`grid gap-3 ${isOwnerIntent ? "" : "sm:grid-cols-2"}`}>
              <button
                className="button-primary"
                disabled={pending}
                type="submit"
              >
                {loginMutation.isPending ? "Signing in..." : primaryButtonLabel}
              </button>
              {!isOwnerIntent ? (
                <button
                  className="button-ghost"
                  disabled={pending}
                  onClick={() => appleMutation.mutate()}
                  type="button"
                >
                  {appleMutation.isPending ? "Connecting..." : "Continue with Apple"}
                </button>
              ) : null}
            </div>

            {GOOGLE_AUTH_ENABLED && !isOwnerIntent ? (
              <div className="soft-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                  Gmail verification
                </p>
                <div className="mt-3">
                  {googleHref ? (
                    <div className="grid gap-3">
                      <p className="text-sm leading-6 text-ink/72">
                        Gmail sign-in now has its own page so the Google step can stay clean and
                        easy to follow.
                      </p>
                      <Link className="button-primary" href={googleHref}>
                        Open Gmail login page
                      </Link>
                    </div>
                  ) : (
                    <GoogleIdentityButton
                      onCredential={(identityToken) => googleMutation.mutate(identityToken)}
                      onError={(message) => setStatusMessage(message)}
                      text="continue_with"
                    />
                  )}
                </div>
                {googleMutation.isPending ? (
                  <p className="mt-3 text-sm text-pine">Verifying your Google account...</p>
                ) : null}
              </div>
            ) : (
              <div className="soft-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                  Owner access note
                </p>
                <p className="mt-3 text-sm leading-6 text-ink/72">
                  Owners sign in with the password-backed account created from the owner setup flow.
                  Gmail and OTP are kept on the renter path so listing management stays predictable.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              disabled={!session || pending}
              className="button-ghost"
              onClick={() => refreshMutation.mutate()}
              type="button"
            >
              {refreshMutation.isPending ? "Refreshing..." : "Refresh session"}
            </button>
            <button
              className="button-accent"
              disabled={!session || pending}
              onClick={() => logoutMutation.mutate()}
              type="button"
            >
              {logoutMutation.isPending ? "Signing out..." : "Logout / sign out"}
            </button>
            <Link
              className="button-secondary"
              href={onboardingHref}
            >
              Open full onboarding
            </Link>
          </div>
        </div>

        <div className="soft-panel mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pine">
            Session state
          </p>
          {session ? (
            <div className="mt-4 grid gap-2 text-sm text-ink/78">
              <p>
                <span className="font-semibold text-ink">Name:</span>{" "}
                {session.fullName ?? "Not available"}
              </p>
              <p>
                <span className="font-semibold text-ink">Email:</span>{" "}
                {session.email ?? "Not available"}
              </p>
              <p>
                <span className="font-semibold text-ink">Email verified:</span>{" "}
                {session.emailVerified ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold text-ink">Auth method:</span> {session.authMethod}
              </p>
              <p>
                <span className="font-semibold text-ink">User id:</span> {session.userId}
              </p>
              <p>
                <span className="font-semibold text-ink">Access token:</span>{" "}
                {session.accessToken.slice(0, 18)}...
              </p>
              <p>
                <span className="font-semibold text-ink">Refresh token:</span>{" "}
                {session.refreshToken.slice(0, 18)}...
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink/72">
              {sessionEmptyLabel}
            </p>
          )}

          {statusMessage ? (
            <p className="mt-4 rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">
              {statusMessage}
            </p>
          ) : null}

          {(loginMutation.error || googleMutation.error || appleMutation.error) ? (
            <p className="mt-4 rounded-2xl bg-copper/10 px-4 py-3 text-sm text-copper">
              Sign-in did not complete. Please try again in a moment.
            </p>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            {isOwnerIntent ? "Owner clarity" : "Fast entry"}
          </p>
          <p className="mt-3 text-lg font-semibold text-ink">
            {isOwnerIntent ? "Owner account, owner dashboard" : "Gmail in one click"}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            {isOwnerIntent
              ? "The owner login goes straight into listing and collection management instead of mixing with renter onboarding."
              : "Continue with a verified Google account without retyping the basics."}
          </p>
        </div>
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Clear control
          </p>
          <p className="mt-3 text-lg font-semibold text-ink">Refresh and sign out</p>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            Session actions stay easy to find instead of being buried in settings.
          </p>
        </div>
        <div className="section-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            {isOwnerIntent ? "Publishing handoff" : "Familiar options"}
          </p>
          <p className="mt-3 text-lg font-semibold text-ink">
            {isOwnerIntent ? "Owner listings show up on the renter side" : "Phone / email / OTP"}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            {isOwnerIntent
              ? "Once an owner publishes a home, the same data flows into renter discovery, search, and property details."
              : "The flow still supports the classic paths people expect when signing in."}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {authScopeItems.map((item) => (
          <div className="soft-panel" key={item.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/72">{item.detail}</p>
              </div>
              <span className="rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="soft-panel">
        <p className="text-sm leading-6 text-ink/72">
          {isOwnerIntent
            ? "New owner here? Start with the owner account setup page, publish your first home, and come back here whenever you want to manage listings."
            : "New here? Start with registration or open the full onboarding console to continue through OTP, profile, preferences, and verification in one guided browser journey."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="button-secondary" href={bottomPrimaryHref}>
            {bottomPrimaryLabel}
          </Link>
          {!isOwnerIntent ? (
            <Link className="button-accent" href={onboardingHref}>
              Open onboarding flow
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
