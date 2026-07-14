"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UpdatePasswordFormProps = {
  mode?: "invite" | "recovery";
};

export function UpdatePasswordForm({
  mode = "recovery",
}: UpdatePasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(
        mode === "invite"
          ? "Could not set the password. Open the latest invite link and try again."
          : "Could not update the password. Open the latest reset link and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    if (mode === "invite") {
      setMessage("Password set. Opening hub...");
      router.replace("/hub");
      router.refresh();
      return;
    }

    setMessage("Password updated. Redirecting to login...");
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="password">
        New password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/35"
          placeholder="New password"
        />
      </label>

      <label
        className="grid gap-1.5 text-sm font-medium"
        htmlFor="confirm-password"
      >
        Confirm password
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/35"
          placeholder="Confirm password"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
      >
        {isSubmitting ? "Updating password" : "Update password"}
      </button>
    </form>
  );
}
