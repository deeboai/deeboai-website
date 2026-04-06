type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 bg-background/50 px-6 py-14 text-center">
      <h4 className="text-lg font-medium">{title}</h4>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
