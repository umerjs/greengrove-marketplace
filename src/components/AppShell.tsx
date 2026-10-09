import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Leaf, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppShell({
  title,
  subtitle,
  roleLabel,
  email,
  children,
}: {
  title: string;
  subtitle?: string;
  roleLabel: string;
  email: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">GreenKarachi</span>
            <span className="ml-2 hidden rounded-full bg-sidebar-accent px-2 py-0.5 text-xs sm:inline">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm opacity-80 sm:inline">{email}</span>
            <Button size="sm" variant="secondary" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
