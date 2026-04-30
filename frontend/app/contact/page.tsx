import { getWebContentPage } from "@/lib/api/client";
import { ContactForm } from "@/components/sections/contact-form";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const page = await getWebContentPage("contact");

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <ContactForm page={page} />
    </main>
  );
}
