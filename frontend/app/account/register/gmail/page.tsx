import { Suspense } from "react";
import { GmailAuthJourney } from "@/components/sections/gmail-auth-journey";

export default function AccountGmailRegisterPage() {
  return (
    <Suspense fallback={null}>
      <GmailAuthJourney mode="register" />
    </Suspense>
  );
}
