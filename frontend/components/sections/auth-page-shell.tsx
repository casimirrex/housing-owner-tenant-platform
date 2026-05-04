import Link from "next/link";
import { AuthExperience } from "@/components/sections/auth-experience";
import { PageContentSections } from "@/components/sections/page-content-sections";
import { RegistrationExperience } from "@/components/sections/registration-experience";
import { LogoutExperience } from "@/components/sections/logout-experience";
import { SignupExperience } from "@/components/sections/signup-experience";
import type { WebContentPageResponse } from "@/lib/api/types";

interface AuthRouteConfig {
  loginHref?: string;
  logoutHref?: string;
  signupHref?: string;
  onboardingHref?: string;
  gmailLoginHref?: string;
  gmailSignupHref?: string;
  ownerLoginHref?: string;
  ownerSetupHref?: string;
  tenantLoginHref?: string;
  roleIntent?: "OWNER" | "TENANT";
}

function remapAuthHref(href: string | null | undefined, routeConfig: AuthRouteConfig) {
  if (!href) {
    return href;
  }

  switch (href) {
    case "/login":
      return routeConfig.loginHref ?? href;
    case "/logout":
      return routeConfig.logoutHref ?? href;
    case "/signup":
    case "/register":
      return routeConfig.signupHref ?? href;
    case "/onboarding":
      return routeConfig.onboardingHref ?? href;
    default:
      return href;
  }
}

export function AuthPageShell({
  page,
  mode,
  routeConfig = {}
}: {
  page: WebContentPageResponse;
  mode: "login" | "logout" | "signup" | "onboarding";
  routeConfig?: AuthRouteConfig;
}) {
  const modeLabel =
    mode === "login"
      ? "Login"
      : mode === "logout"
        ? "Logout"
        : mode === "signup"
          ? "Registration"
          : "Account setup";
  const showOrderedSteps = mode === "login";
  const usesFocusedSignupLayout = mode === "signup";
  const usesFocusedOnboardingLayout = mode === "onboarding";
  const usesFocusedExperienceLayout = usesFocusedSignupLayout || usesFocusedOnboardingLayout;
  const journeyHeading =
    mode === "onboarding"
      ? "Account progress"
      : mode === "signup"
        ? "Registration path"
        : mode === "login"
          ? "Sign-in flow"
          : "Session status";
  const journeyPoints =
    mode === "onboarding"
      ? [
          "Complete your profile, preferences, and password in a calmer step-by-step setup flow.",
          `Guided sections available: ${page.sections.length}`,
          "Finish setup once, then return to search, saved homes, and your account with less friction."
        ]
      : mode === "signup"
        ? [
            "Start with email, phone, or Gmail without sample content getting in the way.",
            `Registration sections available: ${page.sections.length}`,
            "Every route now points into the same clean onboarding experience after sign up."
          ]
        : mode === "login"
          ? [
              "Choose the sign-in method that fits your moment and continue without losing context.",
              `Support sections available: ${page.sections.length}`,
              "Use a single clean account entry point instead of jumping between mixed flows."
            ]
          : [
              "End the current account session clearly and return to guest navigation.",
              `Support sections available: ${page.sections.length}`,
              "Sign-out is separated from sign-in so the account journey stays easier to follow."
            ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.16fr_0.84fr] lg:items-end">
          <div className="relative z-10">
            <span className="eyebrow-pill">{page.eyebrow}</span>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white md:text-lg">
              {page.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-oat/78">
                {page.pageType}
              </span>
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-oat/78">
                {modeLabel}
              </span>
              {page.ctaLabel && remapAuthHref(page.ctaHref, routeConfig) ? (
                <Link className="button-accent" href={remapAuthHref(page.ctaHref, routeConfig)!}>
                  {page.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 dark-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/62">
              {journeyHeading}
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-oat/76">
              {journeyPoints.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {usesFocusedExperienceLayout ? (
        <div className="mt-10 grid gap-6">
          <div className="flex flex-wrap gap-3">
            {mode === "signup" ? (
              <>
                <span className="meta-pill">Phone, email, Google, Apple</span>
                <span className="meta-pill">Cleaner registration flow</span>
                <span className="meta-pill">Browser-first onboarding</span>
              </>
            ) : (
              <>
                <span className="meta-pill">Profile completion</span>
                <span className="meta-pill">Preference setup</span>
                <span className="meta-pill">Password and account readiness</span>
              </>
            )}
          </div>
          {usesFocusedSignupLayout ? (
            <RegistrationExperience
              googleHref={routeConfig.gmailSignupHref}
              loginHref={routeConfig.loginHref ?? "/login"}
              logoutHref={routeConfig.logoutHref ?? "/logout"}
              onboardingHref={routeConfig.onboardingHref ?? "/onboarding"}
              ownerLoginHref={routeConfig.ownerLoginHref ?? "/owner/login"}
              ownerSetupHref={routeConfig.ownerSetupHref ?? "/owner/register"}
              tenantLoginHref={routeConfig.tenantLoginHref ?? "/tenant/login"}
            />
          ) : (
            <SignupExperience
              authPath={routeConfig.signupHref ?? "/signup"}
              googleHref={routeConfig.gmailSignupHref}
              loginHref={routeConfig.loginHref ?? "/login"}
              logoutHref={routeConfig.logoutHref ?? "/logout"}
            />
          )}
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-3">
              <span className="meta-pill">Phone, email, Google, Apple</span>
              <span className="meta-pill">JWT session handling</span>
              <span className="meta-pill">Profile + preference updates</span>
            </div>
            {showOrderedSteps ? (
              <div className="soft-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Follow this order
                </p>
                <p className="mt-3 text-sm leading-6 text-ink/72">
                  Start with Step 1 below, continue downward in order, and then use the form on the
                  right side of the page.
                </p>
              </div>
            ) : null}
            <PageContentSections
              labelPrefix={showOrderedSteps ? "Step" : "Section"}
              ordered={showOrderedSteps}
              sections={page.sections}
              singleColumn={showOrderedSteps}
            />
          </div>
          <div className="grid gap-6">
            {mode === "login" ? (
              <AuthExperience
                authPath={routeConfig.loginHref ?? "/login"}
                googleHref={routeConfig.gmailLoginHref}
                onboardingHref={routeConfig.onboardingHref ?? "/onboarding"}
                ownerLoginHref={routeConfig.ownerLoginHref ?? "/owner/login"}
                ownerSetupHref={routeConfig.ownerSetupHref ?? "/owner/register"}
                roleIntent={routeConfig.roleIntent}
                signupHref={routeConfig.signupHref ?? "/signup"}
                tenantLoginHref={routeConfig.tenantLoginHref ?? "/tenant/login"}
              />
            ) : null}
            {mode === "logout" ? (
              <LogoutExperience returnHref={remapAuthHref(page.ctaHref, routeConfig) ?? null} />
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
