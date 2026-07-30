import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { Panel } from "@/components/ui/Panel";
import { createClient } from "@/lib/supabase/server";

type UpdatePasswordMode = "invite" | "recovery";

type UpdatePasswordPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

function getMode(searchParams: { mode?: string | string[] }): UpdatePasswordMode {
  const mode = Array.isArray(searchParams.mode)
    ? searchParams.mode[0]
    : searchParams.mode;

  return mode === "invite" ? "invite" : "recovery";
}

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedUpdatePasswordPage searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthenticatedUpdatePasswordPage({
  searchParams,
}: {
  searchParams: UpdatePasswordPageProps["searchParams"];
}) {
  await connection();

  const mode = getMode(await searchParams);

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/error");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Pins Hub</p>
          <h1 className="text-xl font-semibold">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>
        <UpdatePasswordForm mode={mode} />
      </Panel>
    </main>
  );
}
