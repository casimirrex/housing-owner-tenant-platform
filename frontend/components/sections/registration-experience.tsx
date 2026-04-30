"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerWithEmail, registerWithPhone } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

type AccountPath = "TENANT" | "OWNER";
type RegistrationChoice = "gmail-address" | "google" | "phone";

const emailRegistrationSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid Gmail or email address")
});

const phoneRegistrationSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  countryCode: z.string().min(2, "Enter a country code"),
  phoneNumber: z.string().min(8, "Enter a valid phone number")
});

type EmailRegistrationValues = z.infer<typeof emailRegistrationSchema>;
type PhoneRegistrationValues = z.infer<typeof phoneRegistrationSchema>;

const accountPathCards: Array<{
  key: AccountPath;
  title: string;
  detail: string;
}> = [
  {
    key: "TENANT",
    title: "Tenant account",
    detail: "Use this path if you want to search homes, save matches, book visits, and pay rent."
  },
  {
    key: "OWNER",
    title: "Owner account",
    detail: "Use this path if you want to publish a property, open the owner dashboard, and manage tenant payments."
  }
];

const choiceCards: Array<{
  key: RegistrationChoice;
  title: string;
  detail: string;
}> = [
  {
    key: "gmail-address",
    title: "Use your Gmail address",
    detail: "Type your own Gmail address directly on this page and start registration."
  },
  {
    key: "google",
    title: "Continue with Google",
    detail: "Open the secure Google page and choose the Gmail account you want to use."
  },
  {
    key: "phone",
    title: "Use your phone number",
    detail: "Register with a mobile number and continue with OTP verification."
  }
];

function buildPhoneDestination(countryCode: string, phoneNumber: string) {
  return `${countryCode}${phoneNumber}`;
}

function isGmailAddress(email: string) {
  return email.trim().toLowerCase().endsWith("@gmail.com");
}

export function RegistrationExperience({
  googleHref,
  loginHref = "/login",
  logoutHref = "/logout",
  onboardingHref = "/onboarding",
  ownerLoginHref = "/owner/login",
  ownerSetupHref = "/list-your-home",
  tenantLoginHref = "/tenant/login"
}: {
  googleHref?: string;
  loginHref?: string;
  logoutHref?: string;
  onboardingHref?: string;
  ownerLoginHref?: string;
  ownerSetupHref?: string;
  tenantLoginHref?: string;
}) {
  const router = useRouter();
  const { session, setSession, setStatusMessage } = useAuthStore();
  const [accountPath, setAccountPath] = useState<AccountPath>("TENANT");
  const [registrationChoice, setRegistrationChoice] =
    useState<RegistrationChoice>("gmail-address");
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const emailRegistrationForm = useForm<EmailRegistrationValues>({
    resolver: zodResolver(emailRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: ""
    }
  });

  const phoneRegistrationForm = useForm<PhoneRegistrationValues>({
    resolver: zodResolver(phoneRegistrationSchema),
    defaultValues: {
      fullName: "",
      countryCode: "+91",
      phoneNumber: ""
    }
  });

  const emailRegistrationMutation = useMutation({
    mutationFn: (values: EmailRegistrationValues) => registerWithEmail(values),
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      setPageNotice("Account created! Taking you to account setup…");
      router.push(onboardingHref);
    },
    onError: (error) => {
      setPageError(error instanceof Error ? error.message : "Registration failed. Please try again.");
    }
  });

  const phoneRegistrationMutation = useMutation({
    mutationFn: (values: PhoneRegistrationValues) => registerWithPhone(values),
    onSuccess: (response) => {
      setSession(response);
      setPageError(null);
      setPageNotice("Account created! Taking you to account setup…");
      router.push(onboardingHref);
    },
    onError: (error) => {
      setPageError(error instanceof Error ? error.message : "Registration failed. Please try again.");
    }
  });

  const pending = emailRegistrationMutation.isPending || phoneRegistrationMutation.isPending;
  const typedEmailAddress = emailRegistrationForm.watch("email");
  const typedGmailAddress = isGmailAddress(typedEmailAddress ?? "");
  const isTenantPath = accountPath === "TENANT";

  const handleEmailRegistration = (values: EmailRegistrationValues) => {
    if (isGmailAddress(values.email)) {
      const gmailPath = googleHref ?? "/account/register/gmail";
      const params = new URLSearchParams({ email: values.email });

      setStatusMessage(
        "Opening the Gmail registration page now. No email will be sent to your inbox for this step."
      );
      router.push(`${gmailPath}?${params.toString()}`);
      return;
    }

    emailRegistrationMutation.mutate(values);
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[0.42fr_0.58fr]">
      <aside className="grid gap-4">
        <div className="grain-card rounded-[32px] border border-white/70 p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Account type
          </p>
          <h3 className="mt-3 font-serif text-3xl text-ink">
            Start with the path that matches what you want to do
          </h3>
          <p className="mt-4 text-sm leading-6 text-ink/72">
            Keep renter registration and owner property publishing separate from the start so the
            next screen feels obvious instead of mixed.
          </p>

          <div className="mt-6 grid gap-3">
            {accountPathCards.map((path) => (
              <button
                className={`rounded-[28px] border p-4 text-left transition ${
                  accountPath === path.key
                    ? "border-pine bg-pine text-oat shadow-soft"
                    : "border-white/70 bg-white/82 text-ink shadow-soft hover:border-pine/30"
                }`}
                key={path.key}
                onClick={() => setAccountPath(path.key)}
                type="button"
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                    accountPath === path.key ? "text-oat/70" : "text-copper"
                  }`}
                >
                  {path.key === "TENANT" ? "Renter journey" : "Owner workspace"}
                </p>
                <p className="mt-2 text-lg font-semibold">{path.title}</p>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    accountPath === path.key ? "text-oat/80" : "text-ink/72"
                  }`}
                >
                  {path.detail}
                </p>
              </button>
            ))}
          </div>

          {isTenantPath && (
            <div className="mt-6 grid gap-3">
              {choiceCards.map((choice) => (
                <button
                  className={`rounded-[28px] border p-4 text-left transition ${
                    registrationChoice === choice.key
                      ? "border-pine bg-pine text-oat shadow-soft"
                      : "border-white/70 bg-white/82 text-ink shadow-soft hover:border-pine/30"
                  }`}
                  key={choice.key}
                  onClick={() => setRegistrationChoice(choice.key)}
                  type="button"
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                      registrationChoice === choice.key ? "text-oat/70" : "text-copper"
                    }`}
                  >
                    {choice.key === "gmail-address"
                      ? "Option 1"
                      : choice.key === "google"
                        ? "Option 2"
                        : "Option 3"}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{choice.title}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      registrationChoice === choice.key ? "text-oat/80" : "text-ink/72"
                    }`}
                  >
                    {choice.detail}
                  </p>
                </button>
              ))}
            </div>
          )}

          {!isTenantPath && (
            <div className="mt-6 rounded-[28px] bg-[#f7f6f2] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Owner setup flow
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-ink/74">
                <p>
                  <span className="font-semibold text-ink">1.</span> Create a separate owner
                  account with email, phone, and password.
                </p>
                <p>
                  <span className="font-semibold text-ink">2.</span> Publish the first property
                  from the same setup page.
                </p>
                <p>
                  <span className="font-semibold text-ink">3.</span> Land in the owner dashboard
                  where you can add more listings and assign payments to tenants.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-[28px] bg-[#f7f6f2] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              What happens next
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-ink/74">
              {isTenantPath ? (
                <>
                  <p>
                    <span className="font-semibold text-ink">1.</span> Choose Gmail, Google, or phone.
                  </p>
                  <p>
                    <span className="font-semibold text-ink">2.</span> Enter your own details or open
                    the secure Google page.
                  </p>
                  <p>
                    <span className="font-semibold text-ink">3.</span> Continue into renter account setup
                    after registration starts.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span className="font-semibold text-ink">1.</span> Open the owner setup page.
                  </p>
                  <p>
                    <span className="font-semibold text-ink">2.</span> Save the owner account and first
                    property together.
                  </p>
                  <p>
                    <span className="font-semibold text-ink">3.</span> Continue into the owner dashboard
                    to manage live listings.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {session ? (
          <div className="rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Already signed in
            </p>
            <p className="mt-3 text-sm leading-6 text-ink/74">
              You are currently signed in as{" "}
              <span className="font-semibold text-ink">
                {session.email ?? session.fullName ?? "the current account"}
              </span>
              . If you want to start fresh, open the sign-out page first.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="button-secondary" href={logoutHref}>
                Open sign out page
              </Link>
              <Link className="button-secondary" href={loginHref}>
                Open sign in page
              </Link>
            </div>
          </div>
        ) : null}

        {(emailRegistrationMutation.isSuccess || phoneRegistrationMutation.isSuccess) ? (
          <div className="rounded-[28px] border border-pine/20 bg-pine/6 p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
              Registration complete
            </p>
            <p className="mt-3 text-sm leading-6 text-ink/74">
              Your account has been created. You are now signed in and being taken to account setup.
            </p>
            <div className="mt-4">
              <Link className="button-primary" href={onboardingHref}>
                Continue to account setup
              </Link>
            </div>
          </div>
        ) : null}
      </aside>

      <section className="section-panel self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          {isTenantPath ? "Tenant registration" : "Owner registration"}
        </p>

        {!isTenantPath ? (
          <div className="mt-4 grid gap-6">
            <div>
              <h3 className="font-serif text-3xl text-ink">Create an owner account and publish the first property</h3>
              <p className="mt-3 text-sm leading-6 text-ink/72">
                Owner registration lives on a dedicated page so property details, owner sign-in,
                and renter accounts do not get tangled together. Start there when your goal is to
                upload a home and manage listings.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="soft-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Owner account includes
                </p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-ink/74">
                  <p>Separate owner sign-in and owner dashboard.</p>
                  <p>Your first live property listing created in the same flow.</p>
                  <p>Access to owner collections and tenant payment assignment.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="button-primary" href={ownerSetupHref}>
                  Start owner setup
                </Link>
                <Link className="button-secondary" href={ownerLoginHref}>
                  Already have owner sign-in?
                </Link>
                <button
                  className="button-secondary"
                  onClick={() => setAccountPath("TENANT")}
                  type="button"
                >
                  I need renter registration instead
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isTenantPath && registrationChoice === "gmail-address" ? (
          <div className="mt-4 grid gap-6">
            <div>
              <h3 className="font-serif text-3xl text-ink">Type your Gmail address here</h3>
              <p className="mt-3 text-sm leading-6 text-ink/72">
                If your email is something like <span className="font-semibold">you@gmail.com</span>
                , enter it here and we will guide you to Google for the secure Gmail registration
                step. You do not need to wait for any email in your inbox from us.
              </p>
            </div>

            <form
              className="grid gap-5"
              onSubmit={emailRegistrationForm.handleSubmit(handleEmailRegistration)}
            >
              <label className="text-sm font-medium text-ink/78">
                Full name
                <input
                  className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none"
                  placeholder="Enter your full name"
                  {...emailRegistrationForm.register("fullName")}
                />
                <span className="mt-2 block text-xs text-copper">
                  {emailRegistrationForm.formState.errors.fullName?.message}
                </span>
              </label>

              <label className="text-sm font-medium text-ink/78">
                Gmail or email address
                <input
                  className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none"
                  placeholder="you@gmail.com"
                  {...emailRegistrationForm.register("email")}
                />
                <span className="mt-2 block text-xs text-copper">
                  {emailRegistrationForm.formState.errors.email?.message}
                </span>
              </label>

              <button
                className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-oat transition hover:bg-ink"
                disabled={pending}
                type="submit"
              >
                {emailRegistrationMutation.isPending
                  ? "Starting registration..."
                  : typedGmailAddress
                    ? "Continue with Gmail"
                    : "Register with this email"}
              </button>
            </form>

            {typedGmailAddress ? (
              <div className="soft-panel">
                <p className="text-sm leading-6 text-ink/74">
                  Next step: after you click the button above, we will open the dedicated Gmail
                  page and Google will ask you to confirm the Gmail account. No mail will be sent
                  to your Gmail inbox for this step.
                </p>
              </div>
            ) : null}

            {emailRegistrationMutation.isSuccess ? (
              <div className="soft-panel">
                <p className="text-sm leading-6 text-ink/74">
                  Account created! Redirecting you to account setup…
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {isTenantPath && registrationChoice === "google" ? (
          <div className="mt-4 grid gap-6">
            <div>
              <h3 className="font-serif text-3xl text-ink">Continue with Google securely</h3>
              <p className="mt-3 text-sm leading-6 text-ink/72">
                This option opens a Google window. That is where you choose or type your Gmail
                address. It is kept separate so the page stays clean and easy to follow.
              </p>
            </div>

            <div className="soft-panel">
              <p className="text-sm leading-6 text-ink/74">
                Use this when you want Google to verify your Gmail account for you instead of typing
                the address into the register form.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {googleHref ? (
                  <Link className="button-primary" href={googleHref}>
                    Open secure Gmail registration
                  </Link>
                ) : null}
                <Link className="button-secondary" href={onboardingHref}>
                  Continue to account setup
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {isTenantPath && registrationChoice === "phone" ? (
          <div className="mt-4 grid gap-6">
            <div>
              <h3 className="font-serif text-3xl text-ink">Register with your phone number</h3>
              <p className="mt-3 text-sm leading-6 text-ink/72">
                Use this path if you want OTP-based registration instead of Gmail or email.
              </p>
            </div>

            <form
              className="grid gap-5"
              onSubmit={phoneRegistrationForm.handleSubmit((values) =>
                phoneRegistrationMutation.mutate(values)
              )}
            >
              <label className="text-sm font-medium text-ink/78">
                Full name
                <input
                  className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none"
                  placeholder="Enter your full name"
                  {...phoneRegistrationForm.register("fullName")}
                />
                <span className="mt-2 block text-xs text-copper">
                  {phoneRegistrationForm.formState.errors.fullName?.message}
                </span>
              </label>

              <div className="grid gap-5 sm:grid-cols-[0.34fr_0.66fr]">
                <label className="text-sm font-medium text-ink/78">
                  Country code
                  <input
                    className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none"
                    placeholder="+91"
                    {...phoneRegistrationForm.register("countryCode")}
                  />
                  <span className="mt-2 block text-xs text-copper">
                    {phoneRegistrationForm.formState.errors.countryCode?.message}
                  </span>
                </label>

                <label className="text-sm font-medium text-ink/78">
                  Phone number
                  <input
                    className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none"
                    placeholder="Enter your phone number"
                    {...phoneRegistrationForm.register("phoneNumber")}
                  />
                  <span className="mt-2 block text-xs text-copper">
                    {phoneRegistrationForm.formState.errors.phoneNumber?.message}
                  </span>
                </label>
              </div>

              <button
                className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-oat transition hover:bg-ink"
                disabled={pending}
                type="submit"
              >
                {phoneRegistrationMutation.isPending
                  ? "Starting registration..."
                  : "Register with phone"}
              </button>
            </form>

            {phoneRegistrationMutation.isSuccess ? (
              <div className="soft-panel">
                <p className="text-sm leading-6 text-ink/74">
                  Account created! Redirecting you to account setup…
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          {pageNotice ? (
            <p className="rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">{pageNotice}</p>
          ) : null}
          {pageError ? (
            <p className="rounded-2xl bg-copper/10 px-4 py-3 text-sm text-copper">
              {pageError}
            </p>
          ) : null}
          <p className="text-sm leading-6 text-ink/70">
            {isTenantPath ? (
              <>
                Already have a renter account? <Link className="font-semibold text-pine" href={tenantLoginHref}>Sign in here</Link>.
              </>
            ) : (
              <>
                Already have an owner account? <Link className="font-semibold text-pine" href={ownerLoginHref}>Sign in here</Link>.
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
