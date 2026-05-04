"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CircleUserRound,
  ListChecks,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getCurrentUserProfile,
  getUserPreferences,
  getUserVerificationStatus,
  setCurrentUserPassword,
  updateCurrentUserProfile,
  updateUserPreferences
} from "@/lib/api/client";
import { GOOGLE_AUTH_ENABLED } from "@/lib/feature-flags";
import { useAuthStore } from "@/store/auth-store";

type SetupStep = "profile" | "preferences" | "security";

const optionalText = z.string().trim();
const optionalDate = z.string().trim();
const optionalUrl = z.union([z.literal(""), z.string().url("Enter a valid URL")]);

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  gender: z.string().min(2, "Enter your gender"),
  city: z.string().min(2, "Enter your city"),
  dateOfBirth: optionalDate,
  occupation: z.string().min(2, "Enter your occupation"),
  emergencyContactName: z.string().min(2, "Enter an emergency contact name"),
  emergencyContactPhone: z.string().min(10, "Enter an emergency contact number"),
  employmentType: optionalText,
  employerName: optionalText,
  monthlyIncomeRange: optionalText,
  previousLandlordName: optionalText,
  previousLandlordPhone: optionalText,
  aadhaarLast4: z.union([z.literal(""), z.string().regex(/^\d{4}$/, "Enter the last 4 Aadhaar digits")]),
  panCardNumber: optionalText,
  governmentIdType: optionalText,
  governmentIdPhotoUrl: optionalUrl,
  upiId: optionalText,
  photoUrl: z.string().url("Enter a valid profile image URL")
});

const preferencesSchema = z.object({
  budgetMin: z.number().min(0, "Budget min must be positive"),
  budgetMax: z.number().min(0, "Budget max must be positive"),
  bhkPreference: z.string().min(2, "Enter your BHK preference"),
  furnishingPreference: z.string().min(2, "Enter your furnishing preference"),
  commuteLocation: z.string().min(2, "Enter your commute location"),
  moveInDate: optionalDate,
  petFriendly: z.boolean(),
  tenantType: z.string().min(2, "Enter your tenant type"),
  lifestyleTags: z.string().min(2, "Add at least one lifestyle tag")
});

const passwordSetupSchema = z.object({
  newPassword: z.string().min(8, "Enter a password with at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password")
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ProfileValues = z.infer<typeof profileSchema>;
type PreferencesValues = z.infer<typeof preferencesSchema>;
type PasswordSetupValues = z.infer<typeof passwordSetupSchema>;

const setupSteps: Array<{
  key: SetupStep;
  eyebrow: string;
  title: string;
  detail: string;
}> = [
  {
    key: "profile",
    eyebrow: "Step 1",
    title: "Complete your profile",
    detail: "Add the identity details owners and recommendations rely on."
  },
  {
    key: "preferences",
    eyebrow: "Step 2",
    title: "Set your home preferences",
    detail: "Tell the app what budget, commute, and lifestyle fit you best."
  },
  {
    key: "security",
    eyebrow: "Step 3",
    title: "Review readiness and security",
    detail: "Check verification, add an app password if needed, and start browsing."
  }
];

function joinTags(tags: string[]) {
  return tags.join(", ");
}

function splitTags(rawValue: string) {
  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function completionCopy(percent: number) {
  if (percent >= 85) {
    return "Your account is almost ready to use end to end.";
  }
  if (percent >= 55) {
    return "You have finished the essentials. One or two details are left.";
  }
  return "Start with the basics so recommendations and verification feel more personal.";
}

export function SignupExperience({
  googleHref,
  loginHref = "/login",
  logoutHref = "/logout"
}: {
  authPath?: string;
  googleHref?: string;
  loginHref?: string;
  logoutHref?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, updateSessionIdentity, setStatusMessage } = useAuthStore();
  const [activeStep, setActiveStep] = useState<SetupStep>("profile");
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const accessToken = session?.accessToken;
  const isSignedIn = Boolean(accessToken);

  const profileQuery = useQuery({
    queryKey: ["onboarding-profile", accessToken ?? "guest"],
    queryFn: () => getCurrentUserProfile(accessToken),
    enabled: isSignedIn
  });

  const preferencesQuery = useQuery({
    queryKey: ["onboarding-preferences", accessToken ?? "guest"],
    queryFn: () => getUserPreferences(accessToken),
    enabled: isSignedIn
  });

  const verificationQuery = useQuery({
    queryKey: ["onboarding-verification", accessToken ?? "guest"],
    queryFn: () => getUserVerificationStatus(accessToken),
    enabled: isSignedIn
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      gender: "",
      city: "",
      dateOfBirth: "",
      occupation: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      employmentType: "",
      employerName: "",
      monthlyIncomeRange: "",
      previousLandlordName: "",
      previousLandlordPhone: "",
      aadhaarLast4: "",
      panCardNumber: "",
      governmentIdType: "",
      governmentIdPhotoUrl: "",
      upiId: "",
      photoUrl: "https://images.example.com/users/profile-photo.jpg"
    }
  });

  const preferencesForm = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      budgetMin: 15000,
      budgetMax: 35000,
      bhkPreference: "1BHK,2BHK",
      furnishingPreference: "Semi Furnished",
      commuteLocation: "Manyata Tech Park",
      moveInDate: "",
      petFriendly: true,
      tenantType: "WORKING_PROFESSIONAL",
      lifestyleTags: "near-metro, quiet-area"
    }
  });

  const passwordSetupForm = useForm<PasswordSetupValues>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    setStatusMessage(null);
  }, [setStatusMessage]);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    profileForm.reset({
      fullName: profileQuery.data.fullName,
      gender: profileQuery.data.gender ?? "",
      city: profileQuery.data.city,
      dateOfBirth: profileQuery.data.dateOfBirth ?? "",
      occupation: profileQuery.data.occupation ?? "",
      emergencyContactName: profileQuery.data.emergencyContactName ?? "",
      emergencyContactPhone: profileQuery.data.emergencyContactPhone ?? "",
      employmentType: profileQuery.data.employmentType ?? "",
      employerName: profileQuery.data.employerName ?? "",
      monthlyIncomeRange: profileQuery.data.monthlyIncomeRange ?? "",
      previousLandlordName: profileQuery.data.previousLandlordName ?? "",
      previousLandlordPhone: profileQuery.data.previousLandlordPhone ?? "",
      aadhaarLast4: profileQuery.data.aadhaarLast4 ?? "",
      panCardNumber: profileQuery.data.panCardNumber ?? "",
      governmentIdType: profileQuery.data.governmentIdType ?? "",
      governmentIdPhotoUrl: profileQuery.data.governmentIdPhotoUrl ?? "",
      upiId: profileQuery.data.upiId ?? "",
      photoUrl: profileQuery.data.photoUrl ?? "https://images.example.com/users/profile-photo.jpg"
    });
  }, [profileForm, profileQuery.data]);

  useEffect(() => {
    if (!preferencesQuery.data) {
      return;
    }

    preferencesForm.reset({
      budgetMin: preferencesQuery.data.budgetMin,
      budgetMax: preferencesQuery.data.budgetMax,
      bhkPreference: preferencesQuery.data.bhkPreference,
      furnishingPreference: preferencesQuery.data.furnishingPreference ?? "",
      commuteLocation: preferencesQuery.data.commuteLocation,
      moveInDate: preferencesQuery.data.moveInDate ?? "",
      petFriendly: preferencesQuery.data.petFriendly,
      tenantType: preferencesQuery.data.tenantType,
      lifestyleTags: joinTags(preferencesQuery.data.lifestyleTags)
    });
  }, [preferencesForm, preferencesQuery.data]);

  const profileDone = Boolean(
    profileQuery.data?.fullName.trim() &&
      profileQuery.data?.city.trim() &&
      profileQuery.data?.gender?.trim() &&
      profileQuery.data?.occupation?.trim() &&
      profileQuery.data?.emergencyContactName?.trim() &&
      profileQuery.data?.emergencyContactPhone?.trim() &&
      profileQuery.data?.photoUrl
  );

  const preferencesDone = Boolean(
    preferencesQuery.data?.furnishingPreference?.trim() &&
    preferencesQuery.data?.commuteLocation.trim() &&
      preferencesQuery.data?.tenantType.trim() &&
      preferencesQuery.data?.lifestyleTags.length
  );

  const securityDone = Boolean(
    verificationQuery.data &&
      (verificationQuery.data.emailVerified || verificationQuery.data.phoneVerified) &&
      (profileQuery.data?.hasPassword || session?.authMethod === "GOOGLE")
  );

  const nextRecommendedStep: SetupStep = !profileDone
    ? "profile"
    : !preferencesDone
      ? "preferences"
      : "security";

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    setActiveStep(nextRecommendedStep);
  }, [isSignedIn, nextRecommendedStep]);

  const completionPercent = useMemo(() => {
    if (profileQuery.data?.profileCompletion) {
      return profileQuery.data.profileCompletion;
    }

    let percent = 0;
    if (verificationQuery.data && (verificationQuery.data.emailVerified || verificationQuery.data.phoneVerified)) {
      percent += 25;
    }
    if (profileDone) {
      percent += 35;
    }
    if (preferencesDone) {
      percent += 25;
    }
    if (profileQuery.data?.hasPassword || session?.authMethod === "GOOGLE") {
      percent += 15;
    }
    return Math.min(percent, 100);
  }, [
    preferencesDone,
    profileDone,
    profileQuery.data?.hasPassword,
    profileQuery.data?.profileCompletion,
    session?.authMethod,
    verificationQuery.data
  ]);

  const profileMutation = useMutation({
    mutationFn: (values: ProfileValues) => updateCurrentUserProfile(values, accessToken),
    onSuccess: (response) => {
      queryClient.setQueryData(["onboarding-profile", accessToken ?? "guest"], response.user);
      queryClient.invalidateQueries({ queryKey: ["onboarding-verification"] });
      updateSessionIdentity({
        fullName: response.user.fullName,
        avatarUrl: response.user.photoUrl,
        email: response.user.email
      });
      setPageNotice("Profile saved. Next, set the preferences that shape your home recommendations.");
      setActiveStep("preferences");
    }
  });

  const preferencesMutation = useMutation({
    mutationFn: (values: PreferencesValues) =>
      updateUserPreferences(
        {
          budgetMin: values.budgetMin,
          budgetMax: values.budgetMax,
          bhkPreference: values.bhkPreference,
          furnishingPreference: values.furnishingPreference,
          commuteLocation: values.commuteLocation,
          moveInDate: values.moveInDate,
          petFriendly: values.petFriendly,
          tenantType: values.tenantType,
          lifestyleTags: splitTags(values.lifestyleTags)
        },
        accessToken
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-preferences", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-profile", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-verification", accessToken ?? "guest"] });
      setPageNotice("Preferences saved. Review your readiness and security details next.");
      setActiveStep("security");
    }
  });

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordSetupValues) =>
      setCurrentUserPassword(
        {
          newPassword: values.newPassword
        },
        accessToken
      ),
    onSuccess: (response) => {
      passwordSetupForm.reset({
        newPassword: "",
        confirmPassword: ""
      });
      queryClient.invalidateQueries({ queryKey: ["onboarding-profile", accessToken ?? "guest"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-verification", accessToken ?? "guest"] });
      setPageNotice(response.message);
      router.replace("/");
    }
  });

  const lastErrorMessage =
    (profileMutation.error instanceof Error && profileMutation.error.message) ||
    (preferencesMutation.error instanceof Error && preferencesMutation.error.message) ||
    (passwordMutation.error instanceof Error && passwordMutation.error.message) ||
    null;

  if (!isSignedIn) {
    return (
      <section className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
        <span className="eyebrow-pill">Account setup</span>
        <h3 className="mt-6 font-serif text-4xl leading-tight text-ink">
          Sign in first, then we will help you finish the essentials.
        </h3>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/72">
          This page is now focused only on real account setup after registration. Start with a
          cleaner register or sign-in page, then come back here to complete your profile,
          preferences, and account security.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link className="section-panel flex flex-col gap-3" href="/account/register">
            <CircleUserRound className="h-6 w-6 text-pine" />
            <p className="text-lg font-semibold text-ink">Open registration</p>
            <p className="text-sm leading-6 text-ink/72">
              Create your account with email, phone, or a cleaner Gmail flow.
            </p>
          </Link>
          <Link className="section-panel flex flex-col gap-3" href={loginHref}>
            <BadgeCheck className="h-6 w-6 text-pine" />
            <p className="text-lg font-semibold text-ink">Sign in</p>
            <p className="text-sm leading-6 text-ink/72">
              Already registered? Sign in and continue your setup from where you left off.
            </p>
          </Link>
          {GOOGLE_AUTH_ENABLED ? (
            <Link className="section-panel flex flex-col gap-3" href={googleHref ?? "/account/register/gmail"}>
              <Sparkles className="h-6 w-6 text-pine" />
              <p className="text-lg font-semibold text-ink">Continue with Gmail</p>
              <p className="text-sm leading-6 text-ink/72">
                Use the dedicated Gmail route if you want Google to confirm your account first.
              </p>
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="relative z-10">
            <span className="eyebrow-pill">Welcome back</span>
            <h3 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.05] text-oat md:text-6xl">
              {profileQuery.data?.fullName
                ? `${profileQuery.data.fullName}, let’s finish your renter setup.`
                : "Finish your renter setup with a calmer, cleaner flow."}
            </h3>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/78 md:text-lg">
              Add the details that improve matching, trust, and owner conversations, then move
              straight into search with a profile that feels ready to use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-accent" href="/search">
                Explore homes
              </Link>
              <button
                className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine"
                onClick={() => setActiveStep(nextRecommendedStep)}
                type="button"
              >
                Continue with {nextRecommendedStep}
              </button>
              <Link
                className="button-secondary border-white/20 bg-white/10 text-oat hover:bg-white hover:text-pine"
                href={logoutHref}
              >
                Switch account
              </Link>
            </div>
          </div>

          <div className="dark-panel relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/60">
              Account readiness
            </p>
            <div className="mt-5 flex items-end justify-between gap-5">
              <div>
                <p className="font-serif text-5xl text-oat">{completionPercent}%</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-oat/72">
                  {completionCopy(completionPercent)}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-oat/78">
                <p>
                  <span className="font-semibold text-oat">Status:</span>{" "}
                  {verificationQuery.data?.profileStatus ?? "Loading"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-oat">Next step:</span> {nextRecommendedStep}
                </p>
              </div>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#f5c88a] via-[#7ad1b3] to-[#d7f5ea]" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-oat/78">
              <p>Profile saved: {profileDone ? "Yes" : "Not yet"}</p>
              <p>Preferences saved: {preferencesDone ? "Yes" : "Not yet"}</p>
              <p>Account security ready: {securityDone ? "Yes" : "Needs review"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <aside className="grid gap-4">
          <div className="grain-card rounded-[32px] border border-white/70 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Setup steps
            </p>
            <div className="mt-5 grid gap-3">
              {setupSteps.map((step) => {
                const stepComplete =
                  step.key === "profile"
                    ? profileDone
                    : step.key === "preferences"
                      ? preferencesDone
                      : securityDone;

                return (
                  <button
                    className={`rounded-[26px] border p-4 text-left transition ${
                      activeStep === step.key
                        ? "border-pine bg-pine text-oat shadow-soft"
                        : "border-white/70 bg-white/84 text-ink shadow-soft hover:border-pine/30"
                    }`}
                    key={step.key}
                    onClick={() => setActiveStep(step.key)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${activeStep === step.key ? "text-oat/72" : "text-copper"}`}>
                          {step.eyebrow}
                        </p>
                        <p className="mt-2 text-lg font-semibold">{step.title}</p>
                        <p className={`mt-2 text-sm leading-6 ${activeStep === step.key ? "text-oat/78" : "text-ink/72"}`}>
                          {step.detail}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${activeStep === step.key ? "bg-oat/15 text-oat" : stepComplete ? "bg-pine/10 text-pine" : "bg-black/6 text-ink/66"}`}>
                        {stepComplete ? "Done" : step.key === nextRecommendedStep ? "Next" : "Open"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grain-card rounded-[32px] border border-white/70 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              What improves after setup
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-6 text-ink/74">
              <p>Better-matched homes based on commute, budget, and lifestyle.</p>
              <p>Cleaner owner conversations with a completed profile and visible trust signals.</p>
              <p>A faster fallback login if you add an app password after Gmail sign-in.</p>
            </div>
          </div>

          {pageNotice ? (
            <p className="rounded-[28px] bg-pine/10 px-5 py-4 text-sm leading-6 text-pine shadow-soft">
              {pageNotice}
            </p>
          ) : null}

          {lastErrorMessage ? (
            <p className="rounded-[28px] bg-copper/10 px-5 py-4 text-sm leading-6 text-copper shadow-soft">
              {lastErrorMessage}
            </p>
          ) : null}
        </aside>

        <div className="grid gap-6">
          {activeStep === "profile" ? (
            <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Profile details
                </p>
                <h3 className="mt-3 font-serif text-3xl text-ink">
                  Introduce yourself the way owners and recommendations should see you.
                </h3>
                <form
                  className="mt-8 grid gap-5"
                  onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
                >
                  <div className="rounded-[26px] bg-pine/6 p-4 text-sm leading-6 text-ink/72">
                    Complete the fields owners usually need first: identity basics, emergency contact,
                    KYC essentials, and a payment-ready UPI handle.
                  </div>
                  <label className="text-sm font-medium text-ink/78">
                    Full name
                    <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("fullName")} />
                    <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.fullName?.message}</span>
                  </label>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-ink/78">
                      Gender
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("gender")} />
                      <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.gender?.message}</span>
                    </label>
                    <label className="text-sm font-medium text-ink/78">
                      City
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("city")} />
                      <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.city?.message}</span>
                    </label>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-ink/78">
                      Date of birth
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" type="date" {...profileForm.register("dateOfBirth")} />
                    </label>
                    <label className="text-sm font-medium text-ink/78">
                      Occupation
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("occupation")} />
                      <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.occupation?.message}</span>
                    </label>
                  </div>
                  <div className="surface-divider" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                      Emergency contact
                    </p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-ink/78">
                        Emergency contact name
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("emergencyContactName")} />
                        <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.emergencyContactName?.message}</span>
                      </label>
                      <label className="text-sm font-medium text-ink/78">
                        Emergency contact phone
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("emergencyContactPhone")} />
                        <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.emergencyContactPhone?.message}</span>
                      </label>
                    </div>
                  </div>
                  <div className="surface-divider" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                      Financial and background details
                    </p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-ink/78">
                        Employment type
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("employmentType")} />
                      </label>
                      <label className="text-sm font-medium text-ink/78">
                        Employer name
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("employerName")} />
                      </label>
                    </div>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-ink/78">
                        Monthly income range
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("monthlyIncomeRange")} />
                      </label>
                      <label className="text-sm font-medium text-ink/78">
                        UPI ID
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("upiId")} />
                      </label>
                    </div>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-ink/78">
                        Previous landlord name
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("previousLandlordName")} />
                      </label>
                      <label className="text-sm font-medium text-ink/78">
                        Previous landlord phone
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("previousLandlordPhone")} />
                      </label>
                    </div>
                  </div>
                  <div className="surface-divider" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                      e-KYC basics
                    </p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-ink/78">
                        Aadhaar last 4 digits
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" maxLength={4} {...profileForm.register("aadhaarLast4")} />
                        <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.aadhaarLast4?.message}</span>
                      </label>
                      <label className="text-sm font-medium text-ink/78">
                        PAN card number
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 uppercase outline-none" {...profileForm.register("panCardNumber")} />
                      </label>
                    </div>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <label className="text-sm font-medium text-ink/78">
                        Government ID type
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("governmentIdType")} />
                      </label>
                      <label className="text-sm font-medium text-ink/78">
                        Government ID photo URL
                        <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("governmentIdPhotoUrl")} />
                        <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.governmentIdPhotoUrl?.message}</span>
                      </label>
                    </div>
                  </div>
                  <label className="text-sm font-medium text-ink/78">
                    Profile photo URL
                    <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...profileForm.register("photoUrl")} />
                    <span className="mt-2 block text-xs text-copper">{profileForm.formState.errors.photoUrl?.message}</span>
                  </label>
                  <button className="button-primary justify-center" disabled={profileMutation.isPending || profileQuery.isLoading} type="submit">
                    {profileMutation.isPending ? "Saving profile..." : "Save profile and continue"}
                  </button>
                </form>
              </div>

              <div className="grid gap-6">
                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Current account snapshot
                  </p>
                  {profileQuery.data ? (
                    <div className="mt-5 grid gap-3 text-sm leading-6 text-ink/76">
                      <p><span className="font-semibold text-ink">Name:</span> {profileQuery.data.fullName}</p>
                      <p><span className="font-semibold text-ink">Email:</span> {profileQuery.data.email ?? "Not added yet"}</p>
                      <p><span className="font-semibold text-ink">Phone:</span> {profileQuery.data.phoneNumber ?? "Not added yet"}</p>
                      <p><span className="font-semibold text-ink">City and occupation:</span> {profileQuery.data.city} • {profileQuery.data.occupation ?? "Add your occupation"}</p>
                      <p><span className="font-semibold text-ink">Emergency contact:</span> {profileQuery.data.emergencyContactName && profileQuery.data.emergencyContactPhone ? `${profileQuery.data.emergencyContactName} • ${profileQuery.data.emergencyContactPhone}` : "Add a next-of-kin or emergency contact"}</p>
                      <p><span className="font-semibold text-ink">UPI and payout readiness:</span> {profileQuery.data.upiId ?? "Add a UPI handle for faster agreement and payment setup"}</p>
                      <p><span className="font-semibold text-ink">KYC basics:</span> {profileQuery.data.aadhaarLast4 ? `Aadhaar ending ${profileQuery.data.aadhaarLast4}` : "Not started yet"}</p>
                      <p><span className="font-semibold text-ink">Last saved status:</span> {profileQuery.data.profileStatus}</p>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm leading-6 text-ink/72">Loading your profile…</p>
                  )}
                </div>

                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Why this matters
                  </p>
                  <div className="mt-5 grid gap-4 text-sm leading-6 text-ink/74">
                    <p>Emergency contact and work details are commonly requested before Indian rental agreements, so adding them early reduces back-and-forth later.</p>
                    <p>Your KYC basics and payment handle help the app move you from browsing into agreement-ready conversations without another profile detour.</p>
                    <p>Adding a profile photo still improves trust when you move into visits and owner conversations.</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === "preferences" ? (
            <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
              <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  Home preferences
                </p>
                <h3 className="mt-3 font-serif text-3xl text-ink">
                  Shape the search around how you actually want to live.
                </h3>
                <form
                  className="mt-8 grid gap-5"
                  onSubmit={preferencesForm.handleSubmit((values) => preferencesMutation.mutate(values))}
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-ink/78">
                      Budget min
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" type="number" {...preferencesForm.register("budgetMin", { valueAsNumber: true })} />
                      <span className="mt-2 block text-xs text-copper">{preferencesForm.formState.errors.budgetMin?.message}</span>
                    </label>
                    <label className="text-sm font-medium text-ink/78">
                      Budget max
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" type="number" {...preferencesForm.register("budgetMax", { valueAsNumber: true })} />
                      <span className="mt-2 block text-xs text-copper">{preferencesForm.formState.errors.budgetMax?.message}</span>
                    </label>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-ink/78">
                      BHK preference
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...preferencesForm.register("bhkPreference")} />
                      <span className="mt-2 block text-xs text-copper">{preferencesForm.formState.errors.bhkPreference?.message}</span>
                    </label>
                    <label className="text-sm font-medium text-ink/78">
                      Furnishing preference
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...preferencesForm.register("furnishingPreference")} />
                      <span className="mt-2 block text-xs text-copper">{preferencesForm.formState.errors.furnishingPreference?.message}</span>
                    </label>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-medium text-ink/78">
                      Tenant type
                      <select className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...preferencesForm.register("tenantType")}>
                        <option value="WORKING_PROFESSIONAL">WORKING_PROFESSIONAL</option>
                        <option value="FAMILY">FAMILY</option>
                        <option value="STUDENT">STUDENT</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium text-ink/78">
                      Ideal move-in date
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" type="date" {...preferencesForm.register("moveInDate")} />
                    </label>
                  </div>
                  <label className="text-sm font-medium text-ink/78">
                    Commute location
                    <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...preferencesForm.register("commuteLocation")} />
                    <span className="mt-2 block text-xs text-copper">{preferencesForm.formState.errors.commuteLocation?.message}</span>
                  </label>
                  <label className="text-sm font-medium text-ink/78">
                    Lifestyle tags
                    <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" {...preferencesForm.register("lifestyleTags")} />
                    <span className="mt-2 block text-xs text-copper">{preferencesForm.formState.errors.lifestyleTags?.message}</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white/80 px-4 py-4 text-sm font-medium text-ink/78">
                    <input type="checkbox" {...preferencesForm.register("petFriendly")} />
                    Prefer pet-friendly homes
                  </label>
                  <button className="button-primary justify-center" disabled={preferencesMutation.isPending} type="submit">
                    {preferencesMutation.isPending ? "Saving preferences..." : "Save preferences and continue"}
                  </button>
                </form>
              </div>

              <div className="grid gap-6">
                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Recommendation context
                  </p>
                  {preferencesQuery.data ? (
                    <>
                      <div className="mt-5 grid gap-3 text-sm leading-6 text-ink/76">
                        <p><span className="font-semibold text-ink">Budget:</span> Rs. {preferencesQuery.data.budgetMin.toLocaleString("en-IN")} to Rs. {preferencesQuery.data.budgetMax.toLocaleString("en-IN")}</p>
                        <p><span className="font-semibold text-ink">BHK:</span> {preferencesQuery.data.bhkPreference}</p>
                        <p><span className="font-semibold text-ink">Furnishing:</span> {preferencesQuery.data.furnishingPreference ?? "Add your furnishing preference"}</p>
                        <p><span className="font-semibold text-ink">Commute anchor:</span> {preferencesQuery.data.commuteLocation}</p>
                        <p><span className="font-semibold text-ink">Move-in target:</span> {preferencesQuery.data.moveInDate ? preferencesQuery.data.moveInDate : "Flexible"}</p>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {preferencesQuery.data.lifestyleTags.length ? preferencesQuery.data.lifestyleTags.map((tag) => (
                          <span className="rounded-full bg-pine/10 px-4 py-2 text-sm font-semibold text-pine" key={tag}>
                            {tag}
                          </span>
                        )) : (
                          <span className="rounded-full bg-black/6 px-4 py-2 text-sm text-ink/62">
                            Add lifestyle tags to personalize discovery.
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="mt-5 text-sm leading-6 text-ink/72">Loading preference details…</p>
                  )}
                </div>

                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    What this unlocks
                  </p>
                  <div className="mt-5 grid gap-4 text-sm leading-6 text-ink/74">
                    <p>Budget-aware search defaults that feel closer to your real shortlist.</p>
                    <p>Better match quality around furnishing, commute timing, tenant type, and lifestyle fit.</p>
                    <p>A smoother jump from onboarding into visits and agreement conversations with clearer move-in intent.</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === "security" ? (
            <section className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
              <div className="grid gap-6">
                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Readiness check
                  </p>
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-[24px] bg-white/82 p-4 text-sm leading-6 text-ink/76">
                      <p><span className="font-semibold text-ink">Identity verified:</span> {verificationQuery.data?.emailVerified || verificationQuery.data?.phoneVerified ? "Yes" : "Not yet"}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">Profile status:</span> {verificationQuery.data?.profileStatus ?? "Loading"}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">Security / KYC state:</span> {verificationQuery.data?.kycStatus ?? "Loading"}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">KYC becomes mandatory:</span> {verificationQuery.data?.kycRequiredStage ?? "Loading"}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">Last updated:</span> {verificationQuery.data?.lastUpdatedAt ? formatTimestamp(verificationQuery.data.lastUpdatedAt) : "Loading"}</p>
                    </div>
                    <div className="rounded-[24px] bg-pine/8 p-4 text-sm leading-6 text-ink/76">
                      <p className="font-semibold text-ink">Before you move into search</p>
                      <ul className="mt-3 grid gap-2">
                        <li>Profile complete: {profileDone ? "Done" : "Needs attention"}</li>
                        <li>Preferences saved: {preferencesDone ? "Done" : "Needs attention"}</li>
                        <li>Photo uploaded: {verificationQuery.data?.photoUploaded ? "Done" : "Needs attention"}</li>
                      </ul>
                    </div>
                    <div className="rounded-[24px] bg-white/82 p-4 text-sm leading-6 text-ink/76">
                      <p className="font-semibold text-ink">KYC guidance</p>
                      <p className="mt-2">
                        {verificationQuery.data?.kycGuidance ??
                          "You can browse and shortlist first. Complete KYC before agreement signing."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Next action
                  </p>
                  <h3 className="mt-3 font-serif text-3xl text-ink">
                    Start exploring homes once this looks right.
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-ink/72">
                    Your account no longer needs the old debug-style onboarding console. Use this
                    page to finish the essentials, then move into actual browsing and matching.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link className="button-primary" href="/search">
                      Explore homes <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      className="button-ghost"
                      onClick={() => setActiveStep(nextRecommendedStep)}
                      type="button"
                    >
                      Return to the next recommended step
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    App password
                  </p>
                  <h3 className="mt-3 font-serif text-3xl text-ink">
                    Add a regular password if you want email or phone login too.
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-ink/72">
                    {profileQuery.data?.hasPassword
                      ? "You already have an app password. Replace it here if you want a new one."
                      : session?.authMethod === "GOOGLE"
                        ? "You signed up with Gmail. Add an app password if you also want normal email or phone login."
                        : "Set an app password here so you can use regular login as well."}
                  </p>
                  <div className="mt-5 rounded-[24px] bg-white/82 p-4 text-sm leading-6 text-ink/76">
                    <p><span className="font-semibold text-ink">Password status:</span> {profileQuery.data?.hasPassword ? "Configured" : "Not set yet"}</p>
                    <p className="mt-2"><span className="font-semibold text-ink">Sign-in identifier:</span> {profileQuery.data?.email ?? profileQuery.data?.phoneNumber ?? "Available after profile load"}</p>
                  </div>
                  <form
                    className="mt-6 grid gap-4"
                    onSubmit={passwordSetupForm.handleSubmit((values) => passwordMutation.mutate(values))}
                  >
                    <label className="text-sm font-medium text-ink/78">
                      New app password
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" type="password" {...passwordSetupForm.register("newPassword")} />
                      <span className="mt-2 block text-xs text-copper">{passwordSetupForm.formState.errors.newPassword?.message}</span>
                    </label>
                    <label className="text-sm font-medium text-ink/78">
                      Confirm password
                      <input className="mt-2 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 outline-none" type="password" {...passwordSetupForm.register("confirmPassword")} />
                      <span className="mt-2 block text-xs text-copper">{passwordSetupForm.formState.errors.confirmPassword?.message}</span>
                    </label>
                    <button className="button-primary justify-center" disabled={passwordMutation.isPending} type="submit">
                      {passwordMutation.isPending
                        ? "Saving password..."
                        : profileQuery.data?.hasPassword
                          ? "Update app password"
                          : "Set app password"}
                    </button>
                  </form>
                </div>

                <div className="grain-card rounded-[32px] border border-white/70 p-8 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Quick summary
                  </p>
                  <div className="mt-5 grid gap-3 text-sm leading-6 text-ink/76">
                    <p className="flex items-center gap-3"><CircleUserRound className="h-4 w-4 text-pine" /> {profileQuery.data?.fullName ?? "Loading profile"}</p>
                    <p className="flex items-center gap-3"><ListChecks className="h-4 w-4 text-pine" /> {preferencesDone ? "Preferences saved and active" : "Preferences still need attention"}</p>
                    <p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-pine" /> {session?.authMethod === "GOOGLE" ? "Gmail sign-in active" : "Standard sign-in active"}</p>
                    <p className="flex items-center gap-3"><BadgeCheck className="h-4 w-4 text-pine" /> Completion score: {completionPercent}%</p>
                    <p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-pine" /> Emergency contact: {profileQuery.data?.emergencyContactName ? "Saved" : "Still missing"}</p>
                    <p className="flex items-center gap-3"><BadgeCheck className="h-4 w-4 text-pine" /> KYC stage: {verificationQuery.data?.kycRequiredStage ?? "Loading"}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
