import { AuthPageShell } from "@/components/sections/auth-page-shell";
import { getWebContentPage } from "@/lib/api/client";
import { withAccountPageContent } from "@/lib/account-page-content";

export const dynamic = "force-dynamic";

export default async function OwnerLoginPage() {
  const basePage = withAccountPageContent("login", await getWebContentPage("login"));
  const page = {
    ...basePage,
    eyebrow: "Owner sign in",
    title: "Sign in to manage listings, tenants, and collections",
    description:
      "Use the owner account created from owner registration. This path is dedicated to property publishing, dashboard management, and payment collection.",
    ctaLabel: "Create owner account",
    ctaHref: "/owner/register",
    sections: [
      {
        heading: "Use the owner account only",
        body: "Owner accounts stay separate from renter accounts so listing management and tenant onboarding do not get mixed together.",
        bullets: [
          "Owner email or phone login",
          "Direct route to owner dashboard",
          "Separate renter sign-in path"
        ]
      },
      {
        heading: "What happens after sign-in",
        body: "After a successful owner login, you land in the owner dashboard where you can add a property, review listings, and assign payments to tenants.",
        bullets: [
          "Add or edit properties",
          "Track live listings",
          "Open collections workspace"
        ]
      }
    ]
  };

  return (
    <AuthPageShell
      mode="login"
      page={page}
      routeConfig={{
        loginHref: "/owner/login",
        logoutHref: "/account/logout",
        onboardingHref: "/owner/dashboard",
        ownerLoginHref: "/owner/login",
        ownerSetupHref: "/owner/register",
        roleIntent: "OWNER",
        signupHref: "/owner/register",
        tenantLoginHref: "/tenant/login"
      }}
    />
  );
}
