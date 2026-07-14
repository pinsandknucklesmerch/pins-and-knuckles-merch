export default function TestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Pins Hub</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
          Operations rebuild
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Initial Next.js Supabase structure ready staged feature work.
        </p>
        <div className="mt-5 flex gap-3 text-sm">
          <a
            href="/hub"
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
          >
            Open hub
          </a>
          <a
            href="/login"
            className="rounded-md border border-border px-3 py-2 font-medium text-foreground"
          >
            Login
          </a>
        </div>
      </section>
    </main>
  );
}
