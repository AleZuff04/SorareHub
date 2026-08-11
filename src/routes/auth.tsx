import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requestAccess } from "@/lib/access-requests.functions";
import { resolvePrimaryEmail } from "@/lib/profile.functions";
const SORARE_LOGO_URL =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/4F4D4x48GucuOXxEwPRCEiFfu4O2/social-images/social-1784033064737-sorare_logo.webp";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const router = useRouter();
  const { next } = Route.useSearch();
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [pendingSubmitted, setPendingSubmitted] = useState(false);
  const requestAccessFn = useServerFn(requestAccess);
  const resolveEmailFn = useServerFn(resolvePrimaryEmail);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const resolved = await resolveEmailFn({ data: { email: email.trim().toLowerCase() } });
        const { error } = await supabase.auth.signInWithPassword({
          email: resolved.email,
          password,
        });
        if (error) throw error;
        toast.success("Accesso effettuato");
        router.navigate({ href: safeNext ?? "/" });
      } else if (mode === "signup") {
        const res = await requestAccessFn({
          data: { email, redirectTo: `${window.location.origin}/reset-password` },
        });
        if (!res.ok) {
          const messages: Record<string, string> = {
            already_registered: "Questa email è già registrata. Effettua il login.",
            already_approved: "Richiesta già approvata: controlla la tua casella email.",
            rejected: "La tua richiesta è stata rifiutata.",
          };
          throw new Error(messages[res.reason] ?? "Richiesta non consentita.");
        }
        if (res.reason === "admin_invited") {
          toast.success("Invito inviato: controlla la tua email.");
          setMsg({
            kind: "ok",
            text: "Accesso admin: invito inviato, controlla la tua email per completare la registrazione.",
          });
        } else {
          toast.success("Richiesta di accesso inviata all'amministratore.");
          setPendingSubmitted(true);
        }
      } else {
        const typed = email.trim().toLowerCase();
        const resolved = await resolveEmailFn({ data: { email: typed } });
        const { error } = await supabase.auth.resetPasswordForEmail(resolved.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email di recupero inviata");
        setMsg({
          kind: "ok",
          text: resolved.viaBackup
            ? "Hai inserito un'email di backup: il link di recupero è stato inviato all'email principale del tuo account. Il link aggiorna la password dello stesso account, quindi potrai poi accedere con l'email principale oppure con quella di backup e ritroverai tutti i tuoi dati."
            : "Email di recupero inviata. Controlla la tua casella.",
        });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Errore";
      toast.error(m);
      setMsg({ kind: "err", text: m });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Contact CTA */}
      <a
        href="https://t.me/AleZuff"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 left-4 z-20 max-w-[65vw] rounded-xl border border-cyan-400/30 bg-slate-900/80 px-4 py-2.5 text-center shadow-lg backdrop-blur transition hover:border-cyan-400 hover:bg-slate-800/90 hover:shadow-cyan-500/20"
      >
        <p className="text-[11px] font-medium leading-tight text-slate-200">
          Per acquistare o per ulteriori informazioni contattami!
        </p>
        <p className="mt-0.5 text-base font-bold text-cyan-300">t.me/AleZuff</p>
      </a>

      {/* Glow bg */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <img
            src={SORARE_LOGO_URL}
            alt="SorareHub Logo"
            className="mx-auto mb-3 h-20 w-20 rounded-2xl object-cover shadow-lg shadow-blue-500/30"
          />
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-blue-400 to-cyan-300 bg-clip-text text-2xl font-black tracking-tight text-transparent">
            SorareHub
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {mode === "login" && "Accedi al tuo gestionale"}
            {mode === "signup" && !pendingSubmitted && "Richiedi accesso"}
            {mode === "signup" && pendingSubmitted && "Richiesta inviata"}
            {mode === "forgot" && "Recupera la tua password"}
          </p>
        </div>

        {mode === "signup" && pendingSubmitted ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 p-4 text-center">
              <div className="text-3xl">📨</div>
              <p className="mt-2 text-sm text-cyan-100">
                Richiesta inviata all'amministratore.
                <br />
                Riceverai la mail di attivazione non appena la tua richiesta sarà accettata.
              </p>
            </div>
            <button
              onClick={() => {
                setPendingSubmitted(false);
                setMode("login");
                setMsg(null);
              }}
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              ← Torna al login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  placeholder="tu@esempio.com"
                />
              </div>
              {mode === "login" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30"
                    placeholder="••••••••"
                  />
                </div>
              )}
              {mode === "signup" && (
                <p className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-[11px] text-fuchsia-200">
                  La registrazione è soggetta ad approvazione manuale. Riceverai la mail di
                  attivazione (con impostazione password) una volta accettata la richiesta.
                </p>
              )}

              {msg && (
                <div
                  className={
                    "rounded-lg border px-3 py-2 text-xs " +
                    (msg.kind === "err"
                      ? "border-red-500/40 bg-red-500/10 text-red-300"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300")
                  }
                >
                  {msg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-blue-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-fuchsia-500/40 disabled:opacity-60"
              >
                {loading
                  ? "Attendere…"
                  : mode === "login"
                    ? "Accedi"
                    : mode === "signup"
                      ? "Registrati"
                      : "Invia email di recupero"}
              </button>
            </form>

            <div className="mt-5 space-y-2 text-center text-xs">
              {mode === "login" && (
                <>
                  <div className="text-slate-400">
                    Non hai un account?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        setMsg(null);
                      }}
                      className="font-semibold text-fuchsia-300 hover:text-fuchsia-200"
                    >
                      Registrati
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setMode("forgot");
                        setMsg(null);
                      }}
                      className="text-slate-400 hover:text-cyan-200"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                </>
              )}
              {mode === "signup" && (
                <div className="text-slate-400">
                  Hai già un account?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setMsg(null);
                    }}
                    className="font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Accedi
                  </button>
                </div>
              )}
              {mode === "forgot" && (
                <button
                  onClick={() => {
                    setMode("login");
                    setMsg(null);
                  }}
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  ← Torna al login
                </button>
              )}
            </div>
          </>
        )}
        <div className="mt-4 text-center text-[10px] text-slate-500">
          <Link to="/" className="hover:text-slate-300">
            SorareHub
          </Link>{" "}
          · gestionale privato e sicuro
        </div>
      </div>
    </div>
  );
}
