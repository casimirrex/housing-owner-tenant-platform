import { Suspense } from "react";
import { GmailAuthJourney } from "@/components/sections/gmail-auth-journey";

export default function AccountGmailLoginPage() {
  return (
    <Suspense fallback={null}>
      <GmailAuthJourney mode="login" />
    </Suspense>
  );
}
