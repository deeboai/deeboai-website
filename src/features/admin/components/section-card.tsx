import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        // Grid children need min-w-0 so wide content can shrink instead of overflowing into neighboring columns.
        "min-w-0 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-lg shadow-black/10",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="min-w-0 pt-5">{children}</div>
    </section>
  );
}
