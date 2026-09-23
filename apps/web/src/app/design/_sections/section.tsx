export function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-border py-12">
      <p className="text-label text-text-3 uppercase">{id.replace(/-/g, " ")}</p>
      <h2 id={`${id}-title`} className="mt-1 text-h2">
        {title}
      </h2>
      {lede ? <p className="mt-2 max-w-2xl text-body text-text-2">{lede}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}
