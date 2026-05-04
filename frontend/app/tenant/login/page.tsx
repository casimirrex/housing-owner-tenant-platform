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
      "Use the renter sign-in path for discovery, saved homes, onboarding, visits, wallet, and payments. Email and phone OTP are supported.",
    ctaLabel: "Create a tenant account",
    ctaHref: "/tenant/register"
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
        ownerLoginHref: "/owner/login",
        ownerSetupHref: "/list-your-home",
        roleIntent: "TENANT",
        tenantLoginHref: "/tenant/login"
      }}
    />
  );
}
