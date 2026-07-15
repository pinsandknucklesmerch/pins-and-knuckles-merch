type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message,
}: ErrorStateProps) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
      <h3 className="text-sm font-semibold text-destructive-foreground">
        {title}
      </h3>
      {message ? (
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
