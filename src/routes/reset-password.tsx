import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMsg({ kind: "err", text: "Le password non coincidono" });
      return;
    }
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    setMsg({ kind: "ok", text: "Password aggiornata! Reindirizzamento…" });
    setTimeout(() => router.navigate({ to: "/" }), 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="mb-1 bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-xl font-black text-transparent">
          Imposta nuova password
        </h1>
        <p className="mb-5 text-xs text-slate-400">Inserisci la nuova password per il tuo account SorareHub.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Nuova password"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
          />
          <input
            type="password" required minLength={6}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Conferma password"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30"
          />
          {msg && (
            <div className={"rounded-lg border px-3 py-2 text-xs " + (msg.kind === "err" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300")}>
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-blue-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-60">
            {loading ? "Aggiornamento…" : "Aggiorna password"}
          </button>
        </form>
      </div>
    </div>
  );
}
