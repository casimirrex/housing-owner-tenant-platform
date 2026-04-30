import Link from "next/link";
import { PageContentSections } from "@/components/sections/page-content-sections";
import type { WebContentPageResponse } from "@/lib/api/types";

function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(updatedAt));
}

export function ContentPageShell({
  page
}: {
  page: WebContentPageResponse;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="hero-panel px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
          <div className="relative z-10">
            <span className="eyebrow-pill">{page.eyebrow}</span>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-oat md:text-6xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-oat/78 md:text-lg">
              {page.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-oat/78">
                {page.pageType}
              </span>
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-oat/78">
                Live content sync {formatUpdatedAt(page.updatedAt)}
              </span>
            </div>
          </div>

          <div className="relative z-10 dark-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oat/62">
              Page summary
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-oat/76">
              <p>
                This page is designed to stay useful, readable, and polished across public, trust,
                and support content.
              </p>
              <p>
                Sections: <span className="font-semibold text-oat">{page.sections.length}</span>
              </p>
              <p>
                Last content update:{" "}
                <span className="font-semibold text-oat">{formatUpdatedAt(page.updatedAt)}</span>
              </p>
            </div>
            {page.ctaLabel && page.ctaHref ? (
              <Link className="button-accent mt-6" href={page.ctaHref}>
                {page.ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <PageContentSections sections={page.sections} />
      </section>
    </main>
  );
}
