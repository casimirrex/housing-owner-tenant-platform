// Gmail SSO has been disabled. This component is kept as an empty
// placeholder so old imports don't break the build. The functional
// Google OAuth code lives behind GOOGLE_AUTH_ENABLED in lib/feature-flags.ts
// and can be restored when the OAuth client config is finalised.
// Standalone /account/login/gmail and /account/register/gmail routes now
// redirect to the email login/registration pages.

interface GmailAuthJourneyProps {
  mode?: "login" | "register";
}

export function GmailAuthJourney(_props: GmailAuthJourneyProps): null {
  return null;
}
