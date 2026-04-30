"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const RETURN_PATH_STORAGE_PREFIX = "housing-owner-tenant-google-oauth:return:";

function OAuthCredentialCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const state = searchParams.get("state");
    const returnPath = state
      ? window.sessionStorage.getItem(`${RETURN_PATH_STORAGE_PREFIX}${state}`)
      : null;

    if (state) {
      window.sessionStorage.removeItem(`${RETURN_PATH_STORAGE_PREFIX}${state}`);
    }

    const destinationUrl = new URL(
      returnPath && returnPath.startsWith("/") ? returnPath : "/account/register/gmail",
      window.location.origin
    );

    const nextQuery = searchParams.toString();
    destinationUrl.search = nextQuery;
    window.location.replace(`${destinationUrl.pathname}${destinationUrl.search}`);
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
      <div className="rounded-[28px] border border-black/8 bg-white px-8 py-10 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper">
          Google OAuth
        </p>
        <h1 className="mt-4 font-serif text-3xl text-ink">Finishing sign-in</h1>
        <p className="mt-4 text-sm leading-6 text-ink/72">
          Google sent us back successfully. We are taking you to the Rent & Beyond Gmail sign-in
          flow now.
        </p>
      </div>
    </main>
  );
}

export default function OAuthCredentialCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCredentialCallbackContent />
    </Suspense>
  );
}
