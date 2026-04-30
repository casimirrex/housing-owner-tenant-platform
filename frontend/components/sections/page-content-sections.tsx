import type { WebContentSectionResponse } from "@/lib/api/types";

export function PageContentSections({
  sections,
  labelPrefix = "Section",
  singleColumn = false,
  ordered = false
}: {
  sections: WebContentSectionResponse[];
  labelPrefix?: string;
  singleColumn?: boolean;
  ordered?: boolean;
}) {
  const gridClassName = singleColumn ? "grid gap-5" : "grid gap-5 xl:grid-cols-2";

  return (
    <div className={gridClassName}>
      {sections.map((section, index) => (
        <article
          className="section-panel"
          key={section.heading}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {ordered ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-semibold text-oat shadow-soft">
                  {index + 1}
                </div>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-copper">
                  {labelPrefix} {index + 1}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">{section.heading}</h3>
                {ordered ? (
                  <p className="mt-2 text-sm leading-6 text-ink/60">
                    {index === 0
                      ? "Start here first."
                      : index === sections.length - 1
                        ? "Finish with this step."
                        : "Complete this after the step above."}
                  </p>
                ) : null}
              </div>
            </div>
            <span className="rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pine">
              {ordered ? "In order" : "Live copy"}
            </span>
          </div>
          <p className="mt-4 text-base leading-7 text-ink/74">{section.body}</p>
          {section.bullets.length ? (
            <ul className="mt-5 grid gap-3">
              {section.bullets.map((bullet) => (
                <li
                  className="rounded-[22px] border border-black/6 bg-white/75 px-4 py-3 text-sm leading-6 text-ink/78"
                  key={bullet}
                >
                  <span className="font-semibold text-pine">-&gt;</span> {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}
