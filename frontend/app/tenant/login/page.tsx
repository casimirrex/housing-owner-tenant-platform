import { AuthPageShell } from "@/components/sections/auth-page-shell";
import { getWebContentPage } from "@/lib/api/client";
import { withAccountPageContent } from "@/lib/account-page-content";

export const dynamic = "force-dynamic";

export default async function TenantLoginPage() {
  const basePage = withAccountPageContent("login", await getWebContentPage("login"));
  const page = {
    ...basePage,
    eyebrow: "Tenant sign in",
    title: "Sign in to continue your renter journey",
    description:
      "Use the renter sign-in path for discovery, saved homes, onboarding, visits, wallet, and payments. Gmail and OTP stay on this renter-friendly side.",
    ctaLabel: "Open Gmail login",
    ctaHref: "/account/login/gmail"
  };

  return (
    <AuthPageShell
      mode="login"
      page={page}
      routeConfig={{
        loginHref: "/tenant/login",
        logoutHref: "/account/logout",
        signupHref: "/account/register",
        onboardingHref: "/account/onboarding",
        gmailLoginHref: "/account/login/gmail",
        ownerLoginHref: "/owner/login",
        ownerSetupHref: "/list-your-home",
        roleIntent: "TENANT",
        tenantLoginHref: "/tenant/login"
      }}
    />
  );
}
