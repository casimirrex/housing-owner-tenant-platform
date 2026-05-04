import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ListYourHomePage() {
  redirect("/owner/register");
}
