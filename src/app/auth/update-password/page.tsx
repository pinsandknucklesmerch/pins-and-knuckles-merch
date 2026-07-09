import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { Panel } from "@/components/ui/Panel";

export default function UpdatePasswordPage() {
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
        <UpdatePasswordForm />
      </Panel>
    </main>
  );
}
