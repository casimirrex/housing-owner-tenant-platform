import { redirect } from "next/navigation";

// Gmail SSO has been removed. Redirect to standard email registration.
export default function AccountGmailRegisterPage() {
  redirect("/account/register");
}
