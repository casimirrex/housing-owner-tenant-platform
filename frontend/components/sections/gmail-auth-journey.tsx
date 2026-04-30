"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getCurrentUserProfile, loginWithGoogle, setCurrentUserPassword } from "@/lib/api/client";
import { GoogleOAuthButton } from "@/components/ui/google-oauth-button";
import { useAuthStore } from "@/store/auth-store";

type GmailJourneyMode = "login" | "register";
type FlowState = "start" | "verifying" | "ready";

const journeyCopy: Record<
  GmailJourneyMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    cardTitle: string;
    cardBody: string;
    inputLabel: string;
    inputPlaceholder: string;
    oauthButtonLabel: string;
    googleButtonText: "continue_with" | "signup_with";
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
    fallbackHref: string;
    fallbackLabel: string;
    alternateHref: string;
    alternateLabel: string;
  }
> = {
  register: {
    eyebrow: "Gmail registration",
    title: "Register with Gmail in a simpler way",
    description:
      "This page follows a cleaner sign-in style: start with your Gmail address, continue to Google, and come back here signed in.",
    cardTitle: "Create your account with Gmail",
    cardBody:
      "Enter your Gmail address if you want Google to open the right account faster. Google still handles your password securely on its own page.",
    inputLabel: "Gmail address",
    inputPlaceholder: "name@gmail.com",
    oauthButtonLabel: "Continue with Gmail",
    googleButtonText: "signup_with",
    primaryHref: "/account/onboarding",
    primaryLabel: "Continue to account setup",
    secondaryHref: "/account/login",
    secondaryLabel: "Already have an account? Sign in",
    fallbackHref: "/account/register",
    fallbackLabel: "Use email or phone instead",
    alternateHref: "/account/login/gmail",
    alternateLabel: "Sign in with Gmail instead"
  },
  login: {
    eyebrow: "Gmail login",
    title: "Sign in with Gmail in a simpler way",
    description:
      "This page keeps Gmail login clear and focused: enter your Gmail address, continue to Google, and come back here signed in.",
    cardTitle: "Sign in with Gmail",
    cardBody:
      "Enter your Gmail address if you want Google to highlight the account you want to use. Google handles the password and verification on its own page.",
    inputLabel: "Gmail address",
    inputPlaceholder: "name@gmail.com",
    oauthButtonLabel: "Sign in with Gmail",
    googleButtonText: "continue_with",
    primaryHref: "/search",
    primaryLabel: "Continue to property search",
    secondaryHref: "/account/register",
    secondaryLabel: "Need a new account? Register",
    fallbackHref: "/account/login",
    fallbackLabel: "Use email or phone instead",
    alternateHref: "/account/register/gmail",
    alternateLabel: "Create a Gmail account entry"
  }
};

const featureItems = [
  {
    title: "Enter your Gmail address",
    detail: "You can type it here first, or leave the field blank and choose your account on Google."
  },
  {
    title: "Continue to Google securely",
    detail: "Google handles the password and account chooser on its own page."
  },
  {
    title: "Come back signed in",
    detail: "After Google returns here, the backend exchanges the OAuth code and starts your session."
  }
];

const passwordSetupSchema = z.object({
  newPassword: z.string().min(8, "Enter a password with at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password")
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

function sanitizeLoginHint(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue || !trimmedValue.includes("@")) {
    return undefined;
  }

  return trimmedValue;
}

function cleanCallbackUrl(routePath: string) {
  if (typeof window !== "undefined" && window.location.search) {
    window.history.replaceState({}, "", routePath);
  }
}

export function GmailAuthJourney({ mode }: { mode: GmailJourneyMode }) {
  const copy = journeyCopy[mode];
  const router = useRouter();
  const { session, statusMessage, setSession, setStatusMessage } = useAuthStore();
  const queryClient = useQueryClient();
  const [flowState, setFlowState] = useState<FlowState>("start");
  const [gmailAddress, setGmailAddress] = useState("");
  const searchParams = useSearchParams();
  const handledResponseRef = useRef<string | null>(null);

  const googleSession = session?.authMethod === "GOOGLE" ? session : null;
  const passwordForm = useForm<z.infer<typeof passwordSetupSchema>>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });
  const routePath = mode === "register" ? "/account/register/gmail" : "/account/login/gmail";
  const oauthCallbackPath = "/rest/oauth2-credential/callback";
  const redirectUri =
    typeof window === "undefined"
      ? `http://localhost:${process.env.PORT ?? "5678"}${oauthCallbackPath}`
      : `${window.location.origin}${oauthCallbackPath}`;
  const oauthStateStorageKey = `housing-owner-tenant-google-oauth:${routePath}`;
  const oauthCodeVerifierStorageKey = `${oauthStateStorageKey}:pkce`;

  const googleMutation = useMutation({
    mutationFn: ({
      authorizationCode,
      codeVerifier
    }: {
      authorizationCode?: string;
      codeVerifier?: string;
    }) =>
      loginWithGoogle({
        authorizationCode,
        codeVerifier,
        redirectUri
      }),
    onMutate: () => {
      setStatusMessage(
        mode === "register"
          ? "Checking your Gmail account and preparing your new profile..."
          : "Checking your Gmail account and signing you in..."
      );
      startTransition(() => setFlowState("verifying"));
    },
    onSuccess: (nextSession) => {
      setSession(nextSession);
      startTransition(() => setFlowState("ready"));
      cleanCallbackUrl(routePath);
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Gmail sign-in failed.");
      startTransition(() => setFlowState("start"));
      cleanCallbackUrl(routePath);
    }
  });

  const profileQuery = useQuery({
    queryKey: ["gmail-user-profile", googleSession?.userId ?? "guest"],
    queryFn: () => getCurrentUserProfile(googleSession?.accessToken),
    enabled: Boolean(googleSession?.accessToken)
  });

  const passwordMutation = useMutation({
    mutationFn: (values: z.infer<typeof passwordSetupSchema>) =>
      setCurrentUserPassword(
        {
          newPassword: values.newPassword
        },
        googleSession?.accessToken
      ),
    onSuccess: (response) => {
      passwordForm.reset({
        newPassword: "",
        confirmPassword: ""
      });
      queryClient.invalidateQueries({ queryKey: ["gmail-user-profile", googleSession?.userId ?? "guest"] });
      setStatusMessage(response.message);
      router.replace("/");
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Password could not be saved.");
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const emailPrefill = searchParams.get("email");
    const hasOauthResponse = searchParams.has("code") || searchParams.has("error");

    if (emailPrefill && !hasOauthResponse && !gmailAddress) {
      setGmailAddress(emailPrefill);
    }
  }, [gmailAddress, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const authorizationCode = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");

    if (!authorizationCode && !oauthError) {
      return;
    }

    const responseKey = `${authorizationCode ?? oauthError}:${returnedState ?? ""}`;
    if (handledResponseRef.current === responseKey) {
      return;
    }
    handledResponseRef.current = responseKey;

    const expectedState = window.sessionStorage.getItem(oauthStateStorageKey);
    const codeVerifier = window.sessionStorage.getItem(oauthCodeVerifierStorageKey);
    window.sessionStorage.removeItem(oauthStateStorageKey);
    window.sessionStorage.removeItem(oauthCodeVerifierStorageKey);

    if (oauthError) {
      setStatusMessage(
        oauthErrorDescription
          ? `Google sign-in was not completed: ${oauthErrorDescription}.`
          : "Google sign-in was not completed."
      );
      startTransition(() => setFlowState("start"));
      cleanCallbackUrl(routePath);
      return;
    }

    if (!returnedState || !expectedState || returnedState !== expectedState) {
      setStatusMessage("Google sign-in could not be verified. Please try again.");
      startTransition(() => setFlowState("start"));
      cleanCallbackUrl(routePath);
      return;
    }

    if (!codeVerifier) {
      setStatusMessage("Google sign-in session expired before verification. Please try again.");
      startTransition(() => setFlowState("start"));
      cleanCallbackUrl(routePath);
      return;
    }

    googleMutation.mutate({
      authorizationCode: authorizationCode ?? undefined,
      codeVerifier
    });
  }, [
    googleMutation,
    oauthCodeVerifierStorageKey,
    oauthStateStorageKey,
    routePath,
    searchParams,
    setStatusMessage
  ]);

  const currentStep =
    flowState === "ready"
      ? 3
      : flowState === "verifying"
        ? 2
        : 1;
  const loginHint = sanitizeLoginHint(gmailAddress);
  const showReadyState = flowState === "ready" && googleSession;
  const showPendingState = flowState === "verifying" || googleMutation.isPending;
  const showErrorState = Boolean(googleMutation.error);
  const hasPassword = profileQuery.data?.hasPassword ?? false;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f5ef_0%,#f3ede2_55%,#efe8da_100%)] px-6 py-10 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_0.78fr] lg:items-center">
        <section className="grid gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-copper">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-tight text-ink md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-ink/72 md:text-lg">
              {copy.description}
            </p>
          </div>

          <div className="grid gap-4">
            {featureItems.map((item, index) => (
              <div
                className="rounded-[28px] border border-black/7 bg-white/84 p-5 shadow-soft"
                key={item.title}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-semibold text-oat">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-ink">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="button-secondary" href={copy.fallbackHref}>
              {copy.fallbackLabel}
            </Link>
            <Link className="button-secondary" href={copy.alternateHref}>
              {copy.alternateLabel}
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[420px] rounded-[34px] border border-black/8 bg-white px-6 py-7 shadow-[0_28px_60px_rgba(28,40,28,0.14)] md:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-copper">
            Rent & Beyond
          </p>

          {showReadyState ? (
            <div className="mt-7 grid gap-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine text-oat">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="text-center">
                <h2 className="font-serif text-3xl text-ink">Gmail connected</h2>
                <p className="mt-3 text-sm leading-6 text-ink/72">
                  Your Gmail account is verified and ready to use in this web application.
                </p>
              </div>

              <div className="rounded-[28px] bg-pine/6 p-5 text-sm text-ink/78">
                <div className="grid gap-3">
                  <p>
                    <span className="font-semibold text-ink">Name:</span>{" "}
                    {googleSession.fullName ?? "Not available"}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Email:</span>{" "}
                    {googleSession.email ?? "Not available"}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Email verified:</span>{" "}
                    {googleSession.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/8 bg-white/84 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                      App password
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">
                      Add a password now if you also want to sign in later with your email inside
                      this app, not only with Gmail SSO.
                    </p>
                  </div>
                  <span className="rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
                    {profileQuery.isLoading ? "Checking" : hasPassword ? "Ready" : "Not set"}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-[#f7f6f2] px-4 py-3 text-sm leading-6 text-ink/74">
                  {hasPassword
                    ? "Your account already has an app password. You can replace it here any time after a Gmail sign-in."
                    : "This Gmail sign-in is complete. Set an app password here if you want email-and-password login as a backup."}
                </div>

                <form
                  className="mt-5 grid gap-4"
                  onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))}
                >
                  <label className="text-sm font-medium text-ink/80">
                    New app password
                    <input
                      className="mt-2 w-full rounded-[22px] border border-black/8 bg-[#f7f6f2] px-4 py-3 outline-none"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                    <span className="mt-2 block text-xs text-copper">
                      {passwordForm.formState.errors.newPassword?.message}
                    </span>
                  </label>
                  <label className="text-sm font-medium text-ink/80">
                    Confirm password
                    <input
                      className="mt-2 w-full rounded-[22px] border border-black/8 bg-[#f7f6f2] px-4 py-3 outline-none"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                    />
                    <span className="mt-2 block text-xs text-copper">
                      {passwordForm.formState.errors.confirmPassword?.message}
                    </span>
                  </label>
                  <button
                    className="button-primary justify-center"
                    disabled={passwordMutation.isPending}
                    type="submit"
                  >
                    {passwordMutation.isPending
                      ? "Saving password..."
                      : hasPassword
                        ? "Update app password"
                        : "Set app password"}
                  </button>
                </form>
              </div>

              <div className="grid gap-3">
                <Link className="button-primary justify-center" href={copy.primaryHref}>
                  {copy.primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link className="button-secondary justify-center" href={copy.secondaryHref}>
                  {copy.secondaryLabel}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-7 grid gap-6">
              <div className="text-center">
                <h2 className="font-serif text-3xl text-ink">{copy.cardTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-ink/72">{copy.cardBody}</p>
              </div>

              <label className="text-sm font-medium text-ink/80">
                {copy.inputLabel}
                <div className="mt-2 flex items-center gap-3 rounded-[22px] border border-black/8 bg-[#f7f6f2] px-4 py-3 focus-within:border-pine/40">
                  <MailCheck className="h-5 w-5 text-pine" />
                  <input
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/38"
                    onChange={(event) => setGmailAddress(event.target.value)}
                    placeholder={copy.inputPlaceholder}
                    type="email"
                    value={gmailAddress}
                  />
                </div>
              </label>

              <GoogleOAuthButton
                codeVerifierStorageKey={oauthCodeVerifierStorageKey}
                label={copy.oauthButtonLabel}
                loginHint={loginHint}
                onError={(message) => setStatusMessage(message)}
                onStart={() =>
                  setStatusMessage(
                    mode === "register"
                      ? "Opening Google sign-up so you can choose your Gmail account..."
                      : "Opening Google sign-in so you can choose your Gmail account..."
                  )
                }
                redirectUri={redirectUri}
                returnPath={routePath}
                stateStorageKey={oauthStateStorageKey}
                text={copy.googleButtonText}
              />

              <p className="text-center text-xs leading-5 text-ink/55">
                {gmailAddress.trim()
                  ? "We will pass this email to Google as a hint so the correct account opens faster."
                  : "You can leave the field blank and choose the Gmail account directly on Google."}
              </p>

              <div className="rounded-[22px] border border-pine/15 bg-pine/6 px-4 py-3 text-sm leading-6 text-ink/74">
                No mail will be sent to your Gmail inbox from this step. After you click the button,
                Google should open directly so you can choose and confirm your account.
              </div>

              {showPendingState ? (
                <p className="rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">
                  Step {currentStep}: Google is processing your sign-in and the backend is finishing
                  your session.
                </p>
              ) : null}

              {statusMessage ? (
                <p className="rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">
                  {statusMessage}
                </p>
              ) : null}

              {showErrorState ? (
                <p className="rounded-2xl bg-copper/10 px-4 py-3 text-sm text-copper">
                  Gmail sign-in did not complete. Please try once more, or return to the email and
                  phone registration page.
                </p>
              ) : null}

              <div className="relative py-1">
                <div className="border-t border-black/10" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink/42">
                  or
                </span>
              </div>

              <div className="grid gap-3">
                <Link
                  className="rounded-full border border-black/10 px-5 py-3 text-center text-sm font-semibold text-ink transition hover:border-pine hover:text-pine"
                  href={copy.fallbackHref}
                >
                  {copy.fallbackLabel}
                </Link>
                <Link
                  className="rounded-full border border-black/10 px-5 py-3 text-center text-sm font-semibold text-ink transition hover:border-pine hover:text-pine"
                  href={copy.secondaryHref}
                >
                  {copy.secondaryLabel}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
