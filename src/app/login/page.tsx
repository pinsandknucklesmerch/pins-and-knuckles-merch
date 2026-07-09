import { LoginForm } from "@/components/auth/LoginForm";
import { Panel } from "@/components/ui/Panel";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Pins Hub</p>
          <h1 className="text-xl font-semibold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Pins Hub account.
          </p>
        </div>
        <LoginForm />
      </Panel>
    </main>
  );
}
