export const metadata = {
  title: "You're offline · Testition"
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
        Offline
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-ink">
        You&apos;re offline
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-ink/72">
        We can&apos;t reach Testition right now. Check your connection and try again — your saved
        searches and shortlist will be waiting when you&apos;re back online.
      </p>
    </main>
  );
}
