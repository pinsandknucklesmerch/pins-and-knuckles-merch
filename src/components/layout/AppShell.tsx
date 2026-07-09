import { SidebarNav } from "@/components/layout/SidebarNav";
import { createClient } from "@/lib/supabase/server";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <SidebarNav userEmail={user?.email ?? null} />
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
