import { LogoutButton } from "@/components/auth/LogoutButton";
import { Panel } from "@/components/ui/Panel";

type AccessDeniedProps = {
  userEmail: string | null;
};

export function AccessDenied({ userEmail }: AccessDeniedProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm">
        <p className="text-xs font-medium text-muted-foreground">
          {userEmail ?? "Signed in"}
        </p>
        <h1 className="mt-2 text-xl font-semibold">Access denied</h1>
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          pins_hub access required
        </p>
        <LogoutButton />
      </Panel>
    </main>
  );
}
