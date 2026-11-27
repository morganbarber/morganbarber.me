/**
 * The opening of every inner page: a mono path label, the title rising in
 * per character (data-split="chars"), and an optional lede. Server component.
 */
export default function PageIntro({
  path,
  title,
  lede,
  children,
}: {
  path: string;
  title: string;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="shell pt-36 pb-16 md:pt-44 md:pb-24">
      <p className="mb-8 label">
        <span className="text-primary">~</span>
        {path}
      </p>
      <h1
        data-split="chars"
        className="font-display text-[clamp(3.5rem,12vw,11rem)] leading-[0.85]"
      >
        {title}
      </h1>
      {lede ? (
        <p data-reveal className="mt-10 max-w-2xl text-xl leading-relaxed text-muted-foreground">
          {lede}
        </p>
      ) : null}
      {children}
    </header>
  );
}
