import { redirect } from "next/navigation";

import { Panel } from "@/components/ui/Panel";
import { parseRecoveryConfirmationInput } from "@/features/auth/lib/recoveryConfirmation";

type RecoveryConfirmationPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function RecoveryConfirmationPage({
  searchParams,
}: RecoveryConfirmationPageProps) {
  const values = await searchParams;
  const input = parseRecoveryConfirmationInput({
    tokenHash: getSingleValue(values.token_hash),
    type: getSingleValue(values.type),
    next: getSingleValue(values.next),
  });

  if (!input) redirect("/auth/error?error=recovery-link-invalid");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm">
        <p className="text-xs font-medium text-muted-foreground">Pins Hub</p>
        <h1 className="mt-2 text-xl font-semibold">Reset your password</h1>
        <form action="/auth/recovery-confirm/verify" method="post" className="mt-5">
          <input name="token_hash" type="hidden" value={input.tokenHash} />
          <input name="type" type="hidden" value="recovery" />
          <input name="next" type="hidden" value={input.next} />
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Continue password reset
          </button>
        </form>
      </Panel>
    </main>
  );
}
