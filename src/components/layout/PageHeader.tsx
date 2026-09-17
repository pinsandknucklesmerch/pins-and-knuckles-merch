type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {action}
      </div>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
