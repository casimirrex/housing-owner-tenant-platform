import { redirect } from "next/navigation";

// OAuth2 credential callback removed. Sends users back to email login.
export default function OAuthCredentialCallbackPage() {
  redirect("/account/login");
}
