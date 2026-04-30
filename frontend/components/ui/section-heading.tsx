export function SectionHeading({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-copper">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-4xl leading-tight text-ink md:text-5xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-ink/70 md:text-lg">{body}</p>
    </div>
  );
}
