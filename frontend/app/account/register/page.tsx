import { AuthPageShell } from "@/components/sections/auth-page-shell";
import { getWebContentPage } from "@/lib/api/client";
import { withAccountPageContent } from "@/lib/account-page-content";

export const dynamic = "force-dynamic";

export default async function AccountRegisterPage() {
  const page = withAccountPageContent("signup", await getWebContentPage("signup"));

  return (
    <AuthPageShell
      mode="signup"
      page={page}
      routeConfig={{
        loginHref: "/account/login",
        logoutHref: "/account/logout",
        signupHref: "/account/register",
        onboardingHref: "/account/onboarding",
        ownerLoginHref: "/owner/login",
        ownerSetupHref: "/list-your-home",
        tenantLoginHref: "/tenant/login"
      }}
    />
  );
}
