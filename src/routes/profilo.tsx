import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSorare } from "@/lib/sorare-store";
import { getMyProfile, updateBackupEmails } from "@/lib/profile.functions";

export const Route = createFileRoute("/profilo")({
  component: ProfiloPage,
});

function ProfiloPage() {
  const { session, signOut } = useSorare();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  const getProfileFn = useServerFn(getMyProfile);
  const updateBackupFn = useServerFn(updateBackupEmails);
  const [b1, setB1] = useState("");
  const [b2, setB2] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingBackup, setSavingBackup] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await getProfileFn();
        if (cancelled) return;
        setB1(p?.backup_email_1 ?? "");
        setB2(p?.backup_email_2 ?? "");
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Errore nel caricamento del profilo");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const saveBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBackup(true);
    try {
      const res = await updateBackupFn({ data: { backup_email_1: b1, backup_email_2: b2 } });
      setB1(res.backup_email_1 ?? "");
      setB2(res.backup_email_2 ?? "");
      toast.success("✅ Email di backup aggiornate");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore nel salvataggio");
    } finally {
      setSavingBackup(false);
    }
  };

  const sendReset = async () => {
    const email = session?.user.email;
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("📧 Email di recupero inviata a " + email);
  };

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      toast.error("Minimo 6 caratteri");
      return setMsg({ kind: "err", text: "Minimo 6 caratteri" });
    }
    if (pw !== confirm) {
      toast.error("Le password non coincidono");
      return setMsg({ kind: "err", text: "Le password non coincidono" });
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return setMsg({ kind: "err", text: error.message });
    }
    setPw(""); setConfirm("");
    toast.success("✅ Password aggiornata");
    setMsg({ kind: "ok", text: "✅ Password aggiornata" });
  };

  return (
    <AppLayout title="Profilo & Sicurezza">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">👤 Account</h2>
        <div className="text-sm">
          <div className="text-muted-foreground text-xs">Email principale</div>
          <div className="font-medium">{session?.user.email}</div>
        </div>
        <button
          onClick={signOut}
          className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
        >
          Esci dall'account
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-1 text-sm font-semibold">📧 Email di backup</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Puoi aggiungere fino a 2 email di backup: potrai usarle per accedere allo stesso account
          (con la stessa password) o per richiedere il recupero password.
        </p>
        <form onSubmit={saveBackup} className="space-y-3">
          <input
            type="email"
            value={b1}
            disabled={loadingProfile}
            onChange={(e) => setB1(e.target.value)}
            placeholder="Email di backup 1 (opzionale)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={b2}
            disabled={loadingProfile}
            onChange={(e) => setB2(e.target.value)}
            placeholder="Email di backup 2 (opzionale)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={savingBackup || loadingProfile}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {savingBackup ? "Salvataggio…" : "Salva email di backup"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">🔐 Cambia password</h2>
        <form onSubmit={change} className="space-y-3">
          <input
            type="password" required minLength={6}
            value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="Nuova password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="password" required minLength={6}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Conferma nuova password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {msg && (
            <div className={"rounded-md border px-3 py-2 text-xs " + (msg.kind === "err" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300")}>
              {msg.text}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit" disabled={loading}
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Aggiornamento…" : "Aggiorna password"}
            </button>
            <button
              type="button" onClick={sendReset}
              className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              Inviami email di recupero
            </button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
}
