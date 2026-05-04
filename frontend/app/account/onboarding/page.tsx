import { AuthPageShell } from "@/components/sections/auth-page-shell";
import { getWebContentPage } from "@/lib/api/client";
import { withAccountPageContent } from "@/lib/account-page-content";

export const dynamic = "force-dynamic";

export default async function AccountOnboardingPage() {
  const page = withAccountPageContent("onboarding", await getWebContentPage("onboarding"));

  return (
    <AuthPageShell
      mode="onboarding"
      page={page}
      routeConfig={{
        loginHref: "/account/login",
        logoutHref: "/account/logout",
        signupHref: "/account/register",
        onboardingHref: "/account/onboarding"
      }}
    />
  );
}
