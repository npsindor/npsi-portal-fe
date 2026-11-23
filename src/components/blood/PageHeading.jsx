// The red icon, title and one-line description at the top of each Blood Help page.
export default function PageHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center text-[#C8102E]">
        <Icon className="h-12 w-12" aria-hidden="true" />
      </span>
      <div>
        <h1 className="font-display text-3xl font-bold text-[#C8102E] sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
