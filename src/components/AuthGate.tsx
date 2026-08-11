import { useEffect, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { useSorare } from "@/lib/sorare-store";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = ["/auth", "/reset-password"];

function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, authReady } = useSorare();
  const router = useRouter();
  const { location } = useRouterState();
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  useEffect(() => {
    if (!authReady) return;
    if (!session && !isPublic) {
      router.navigate({ to: "/auth" });
    } else if (session && location.pathname === "/auth") {
      const next = safeNext((location.search as Record<string, unknown>)?.next);
      router.navigate({ href: next ?? "/" });
    }
  }, [authReady, session, isPublic, location.pathname, location.search, router]);


  // Revalidate session against the server: if the admin deleted the account
  // (or it was otherwise invalidated), force sign-out and back to /auth.
  useEffect(() => {
    if (!session || isPublic) return;

    let cancelled = false;
    const check = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || !data?.user) {
          await supabase.auth.signOut();
          router.navigate({ to: "/auth" });
        }
      } catch {
        // network glitch: ignore
      }
    };

    // Immediate check + on focus + every 60s
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(check, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [session, isPublic, router]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Caricamento…</div>
      </div>
    );
  }

  if (!session && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Reindirizzamento al login…</div>
      </div>
    );
  }

  return <>{children}</>;
}
