import { AuthPageShell } from "@/components/sections/auth-page-shell";
import { getWebContentPage } from "@/lib/api/client";
import { withAccountPageContent } from "@/lib/account-page-content";

export const dynamic = "force-dynamic";

export default async function AccountLogoutPage() {
  const page = withAccountPageContent("logout", await getWebContentPage("logout"));

  return (
    <AuthPageShell
      mode="logout"
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
