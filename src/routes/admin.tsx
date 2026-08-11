import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useSorare } from "@/lib/sorare-store";
import { toast } from "sonner";
import {
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  adminSendPasswordReset,
} from "@/lib/access-requests.functions";

const ADMIN_EMAIL = "zuffolia@gmail.com";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Req = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  approved_at: string | null;
};

function AdminPage() {
  const { session } = useSorare();
  const router = useRouter();
  const isAdmin = (session?.user.email ?? "").toLowerCase() === ADMIN_EMAIL;

  const listFn = useServerFn(listAccessRequests);
  const approveFn = useServerFn(approveAccessRequest);
  const rejectFn = useServerFn(rejectAccessRequest);
  const resetFn = useServerFn(adminSendPasswordReset);

  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listFn();
      setRows(data as Req[]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    if (!isAdmin) {
      router.navigate({ to: "/" });
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isAdmin]);

  if (!session) return null;
  if (!isAdmin) return null;

  const approve = async (id: string) => {
    setBusyId(id);
    setMsg(null);
    try {
      await approveFn({ data: { id, redirectTo: `${window.location.origin}/` } });
      toast.success("Utente approvato: email di attivazione inviata.");
      setMsg("Utente approvato: email di attivazione inviata.");
      await refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Errore";
      toast.error(m);
      setMsg(m);
    } finally {
      setBusyId(null);
    }
  };
  const reject = async (id: string) => {
    if (!confirm("Rifiutare e cancellare la richiesta?")) return;
    setBusyId(id);
    setMsg(null);
    try {
      await rejectFn({ data: { id } });
      await refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Errore";
      toast.error(m);
      setMsg(m);
    } finally {
      setBusyId(null);
    }
  };

  const sendReset = async (email: string) => {
    setBusyId(email);
    try {
      await resetFn({ data: { email, redirectTo: `${window.location.origin}/reset-password` } });
      toast.success(`📧 Email di reset password inviata a ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((r) => r.status === "in_attesa");
  const others = rows.filter((r) => r.status !== "in_attesa");

  return (
    <AppLayout title="Admin — Richieste accesso">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">In attesa ({pending.length})</h2>
            <button
              onClick={refresh}
              className="text-xs rounded-md border border-border px-2 py-1 hover:bg-secondary"
            >
              🔄 Aggiorna
            </button>
          </div>
          {msg && <div className="mt-2 text-xs text-muted-foreground">{msg}</div>}
          {loading && <div className="mt-2 text-xs text-muted-foreground">Caricamento…</div>}
          <ul className="mt-3 space-y-2">
            {pending.length === 0 && !loading && (
              <li className="text-sm text-muted-foreground">Nessuna richiesta in attesa.</li>
            )}
            {pending.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.email}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("it-IT")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busyId === r.id || busyId === r.email}
                    onClick={() => sendReset(r.email)}
                    className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                  >
                    🔑 Reset password
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => approve(r.id)}
                    className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    ✅ Accetta
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => reject(r.id)}
                    className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    ❌ Rifiuta
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {others.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">Cronologia</h2>
            <ul className="mt-3 space-y-2">
              {others.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{r.email}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.status} · {new Date(r.created_at).toLocaleString("it-IT")}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busyId === r.id || busyId === r.email}
                      onClick={() => sendReset(r.email)}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                    >
                      🔑 Reset password
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => reject(r.id)}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                    >
                      Elimina
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
