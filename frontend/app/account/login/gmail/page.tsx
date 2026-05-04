import { redirect } from "next/navigation";

// Gmail SSO has been removed. Redirect to standard email + password login.
export default function AccountGmailLoginPage() {
  redirect("/account/login");
}
