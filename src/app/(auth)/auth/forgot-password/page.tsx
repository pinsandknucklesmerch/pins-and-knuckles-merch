import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Panel } from "@/components/ui/Panel";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Pins Hub</p>
          <h1 className="text-xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we will send a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
      </Panel>
    </main>
  );
}
