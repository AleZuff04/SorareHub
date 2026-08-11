import { Link, useRouterState } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { exportBackup, importBackupFile, useSorare } from "@/lib/sorare-store";

const nav = [
  { to: "/", label: "Galleria & Campionati" },
  { to: "/arene", label: "Arene (Essenze/XP)" },
  { to: "/obiettivi", label: "Obiettivi & ROI" },
  { to: "/plusvalenze", label: "Plusvalenze" },
  { to: "/resoconto", label: "Resoconto Stagione" },
  { to: "/ruota", label: "Ruota" },
  { to: "/profilo", label: "Profilo & Sicurezza" },
] as const;

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { location } = useRouterState();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          aria-label="Apri menu"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/20 grid place-items-center text-primary font-bold">S</div>
          <div className="leading-tight">
            <div className="text-xs text-muted-foreground">Sorare Manager</div>
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LogoutButton />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-sidebar-border bg-sidebar min-h-[calc(100vh-57px)] p-3">
          <SidebarNav pathname={location.pathname} onNavigate={() => {}} />
        </aside>

        {/* Drawer mobile */}
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border p-3">
              <div className="flex items-center justify-between mb-2 px-2 py-1">
                <span className="text-sm font-semibold text-sidebar-foreground">Menu</span>
                <button
                  aria-label="Chiudi menu"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-md border border-sidebar-border text-sidebar-foreground"
                >✕</button>
              </div>
              <SidebarNav pathname={location.pathname} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-3xl p-4 md:p-6 space-y-4">
            {children}
            <BackupBar />
          </div>
        </main>
      </div>

      {/* Follow badge */}
      <a
        href="https://sorare.com/it/football/my-club/alezuff-dnp"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          window.open("https://sorare.com/it/football/my-club/alezuff-dnp", "_blank", "noopener,noreferrer");
        }}
        className="fixed bottom-4 left-4 z-40 max-w-[200px] rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur transition-colors hover:bg-card hover:text-foreground"
      >
        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Follow me on Sorare</span>
        <span className="block truncate text-[11px] font-medium text-primary">alezuff-dnp</span>
      </a>
    </div>
  );
}

function BackupBar() {
  const { cards, competitions, sessions, sessionsRare, sessionsSr, premi, roi, winLog, ricariche, wonCards, crafts, wheelSpins, setCards, setCompetitions, setSessions, setSessionsRare, setSessionsSr, setPremi, setRoi, setWinLog, setRicariche, setWonCards, setCrafts, setWheelSpins } = useSorare();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onImport = async (file: File) => {
    try {
      const data = await importBackupFile(file);
      setCards(data.cards);
      setCompetitions(data.competitions);
      setSessions(data.sessions);
      setSessionsRare(data.sessionsRare);
      setSessionsSr(data.sessionsSr);
      setPremi(data.premi);
      setRoi(data.roi);
      setWinLog(data.winLog);
      setRicariche(data.ricariche);
      setWonCards(data.wonCards);
      setCrafts(data.crafts);
      setWheelSpins(data.wheelSpins);
      setMsg("✅ Backup importato correttamente");
    } catch {
      setMsg("❌ File non valido");
    }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">🔒 Backup dati</div>
      <p className="mb-3 text-xs text-muted-foreground">
        I tuoi dati sono salvati in modo sicuro sul cloud, associati al tuo account. Puoi comunque esportare un backup locale.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => exportBackup({ cards, competitions, sessions, sessionsRare, sessionsSr, premi, roi, winLog, ricariche, wonCards, crafts, wheelSpins })}
          className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          ⬇️ Esporta file di Backup
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
        >
          ⬆️ Importa file di Backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
      </div>
      {msg && <div className="mt-2 text-xs">{msg}</div>}
    </div>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const { session } = useSorare();
  const isAdmin = (session?.user.email ?? "").toLowerCase() === "zuffolia@gmail.com";
  const items = isAdmin
    ? [...nav, { to: "/admin" as const, label: "Admin — Richieste" }]
    : nav;
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={
              "flex items-center rounded-md px-3 py-2 text-sm transition-colors " +
              (active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  const { signOut, session } = useSorare();
  if (!session) return null;
  return (
    <button
      onClick={signOut}
      title={session.user.email ?? "Esci"}
      className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
    >
      Esci
    </button>
  );
}
