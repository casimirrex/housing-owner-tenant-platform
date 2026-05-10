import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { SiteChrome } from "@/components/ui/site-chrome";
import { ServiceWorkerRegistrar } from "@/components/ui/service-worker-registrar";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
import { HtmlLangSync } from "@/components/ui/html-lang-sync";
import { AutoTranslator } from "@/components/ui/auto-translator";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://testition.tech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Testition — Trust-first rentals",
    template: "%s · Testition"
  },
  description:
    "Trust-first property discovery, city landing pages, map search, and detailed rental journeys.",
  applicationName: "Testition",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Testition"
  },
  openGraph: {
    type: "website",
    siteName: "Testition",
    url: SITE_URL,
    title: "Testition — Trust-first rentals",
    description:
      "Verified owners, transparent filters, map-aware discovery. Find your next home with confidence."
  },
  twitter: {
    card: "summary_large_image",
    title: "Testition — Trust-first rentals",
    description:
      "Verified owners, transparent filters, map-aware discovery. Find your next home with confidence."
  }
};

export const viewport: Viewport = {
  themeColor: "#1F4339",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
        <ServiceWorkerRegistrar />
        <OnboardingTour />
        <HtmlLangSync />
        <AutoTranslator />
      </body>
    </html>
  );
}
