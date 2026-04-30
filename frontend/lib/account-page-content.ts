import type { WebContentPageResponse } from "@/lib/api/types";

type AccountPageMode = "login" | "logout" | "onboarding" | "signup";

const pageOverrides: Record<
  AccountPageMode,
  Pick<
    WebContentPageResponse,
    "eyebrow" | "title" | "description" | "pageType" | "ctaLabel" | "ctaHref" | "sections"
  >
> = {
  login: {
    eyebrow: "Account sign in",
    title: "Sign in with email, phone, or Gmail",
    description:
      "Use a cleaner sign-in page for your account. Gmail now has its own focused route, while email and phone stay here for quick access.",
    pageType: "ACCOUNT",
    ctaLabel: "Open Gmail login",
    ctaHref: "/account/login/gmail",
    sections: [
      {
        heading: "Choose how you want to sign in",
        body:
          "Start by deciding whether you want Gmail on its own page or a normal email or phone sign-in form here.",
        bullets: [
          "Dedicated Gmail login page",
          "Email or phone sign in",
          "One clear starting point"
        ]
      },
      {
        heading: "Complete the sign-in on this page",
        body:
          "Use the form on the right to sign in with email or phone, or open the Gmail page if that is your preferred path.",
        bullets: [
          "Email or phone form",
          "Dedicated Gmail button route",
          "Apple sign-in option"
        ]
      },
      {
        heading: "Move to the next page after sign-in",
        body:
          "Once you are signed in, continue to search, account setup, or sign out from the dedicated account routes.",
        bullets: [
          "Continue to search",
          "Open account setup",
          "Use the separate sign-out page when needed"
        ]
      }
    ]
  },
  signup: {
    eyebrow: "Create account",
    title: "Create your account with your own Gmail, email, or phone",
    description:
      "Start registration on a simpler page that lets you use your own Gmail address, email address, or phone number without sample data getting in the way.",
    pageType: "ACCOUNT",
    ctaLabel: "Open Gmail registration",
    ctaHref: "/account/register/gmail",
    sections: [
      {
        heading: "Choose how you want to register",
        body:
          "Start here first. Decide whether you want to type your Gmail address in the form, use Google on its own page, or register with a phone number.",
        bullets: [
          "Type your own Gmail address",
          "Dedicated Google registration route",
          "Phone registration with OTP"
        ]
      },
      {
        heading: "Fill in the form on the right side",
        body:
          "After choosing your method, use the registration area on the right to enter your own details and start the account.",
        bullets: [
          "Enter your name and Gmail address",
          "Or enter phone number",
          "Or open the Google registration page"
        ]
      },
      {
        heading: "Continue into account setup",
        body:
          "After registration starts, move next into OTP, profile details, preferences, and verification in the guided setup flow.",
        bullets: [
          "Open account setup",
          "Complete OTP if needed",
          "Finish profile and preferences"
        ]
      }
    ]
  },
  onboarding: {
    eyebrow: "Finish setup",
    title: "Complete your renter profile and start exploring homes",
    description:
      "After registration or sign-in, use this page to finish your profile, add your preferences, and make your account ready for better recommendations.",
    pageType: "ACCOUNT",
    ctaLabel: "Explore homes",
    ctaHref: "/search",
    sections: [
      {
        heading: "Complete your profile",
        body:
          "Add the key details that help owners and the platform understand who you are and what kind of move you are planning.",
        bullets: [
          "Full name, city, and occupation",
          "Profile photo and identity snapshot",
          "A better first impression for trusted matches"
        ]
      },
      {
        heading: "Set your search preferences",
        body:
          "Save your budget, home size, commute, and lifestyle preferences so the app can shape search results around your needs.",
        bullets: [
          "Budget and BHK goals",
          "Commute and locality fit",
          "Lifestyle and pet-friendly preferences"
        ]
      },
      {
        heading: "Finish account readiness",
        body:
          "Secure the account with an app password, review your readiness, and continue into search once everything feels complete.",
        bullets: [
          "Set or update your app password",
          "Review what is still missing",
          "Continue into home discovery with confidence"
        ]
      }
    ]
  },
  logout: {
    eyebrow: "Sign out",
    title: "End the current account session clearly",
    description:
      "Use a dedicated sign-out page when you want to finish the current session without mixing it into the login or registration screens.",
    pageType: "ACCOUNT",
    ctaLabel: "Return to sign in",
    ctaHref: "/account/login",
    sections: [
      {
        heading: "Keep sign-out separate",
        body:
          "This page is focused only on ending the active session, which keeps the account controls easier to understand.",
        bullets: [
          "Dedicated sign-out route",
          "Clear session status",
          "Easy path back to sign in"
        ]
      }
    ]
  }
};

export function withAccountPageContent(
  mode: AccountPageMode,
  page: WebContentPageResponse
): WebContentPageResponse {
  const override = pageOverrides[mode];

  return {
    ...page,
    ...override,
    updatedAt: page.updatedAt
  };
}
