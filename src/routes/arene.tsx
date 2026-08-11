import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Label, PageTitle, SectionTitle, StatBox } from "@/components/ui-kit";
import { useSorare, type ArenaSession } from "@/lib/sorare-store";

export const Route = createFileRoute("/arene")({
  head: () => ({ meta: [{ title: "Arene — Sorare Manager" }] }),
  component: ArenePage,
});

function ArenePage() {
  const { sessions, setSessions, sessionsRare, setSessionsRare, sessionsSr, setSessionsSr } =
    useSorare();

  return (
    <AppLayout title="Arene (Essenze / XP)">
      <PageTitle>Arene (Essenze / XP)</PageTitle>
      <ArenaBlock title="Arene Limited 🟡" sessions={sessions} setSessions={setSessions} />
      <ArenaBlock title="Arene Rare 🔴" sessions={sessionsRare} setSessions={setSessionsRare} />
      <ArenaBlock title="Arene SR 🔵" sessions={sessionsSr} setSessions={setSessionsSr} />
    </AppLayout>
  );
}

function ArenaBlock({
  title,
  sessions,
  setSessions,
}: {
  title: string;
  sessions: ArenaSession[];
  setSessions: (s: ArenaSession[]) => void;
}) {
  const [spent, setSpent] = useState("");
  const [won, setWon] = useState("");
  const [xp, setXp] = useState("");

  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [eSpent, setESpent] = useState("");
  const [eWon, setEWon] = useState("");
  const [eXp, setEXp] = useState("");

  const handleLog = () => {
    if (!spent || !won || !xp) return;
    setSessions([
      ...sessions,
      { spent: parseInt(spent) || 0, won: parseInt(won) || 0, xp: parseInt(xp) || 0 },
    ]);
    setSpent("");
    setWon("");
    setXp("");
  };

  const startEdit = (i: number) => {
    const s = sessions[i];
    if (!s) return;
    setEditIdx(i);
    setESpent(String(s.spent));
    setEWon(String(s.won));
    setEXp(String(s.xp));
  };

  const saveEdit = () => {
    if (editIdx == null) return;
    const copy = [...sessions];
    copy[editIdx] = {
      spent: parseInt(eSpent) || 0,
      won: parseInt(eWon) || 0,
      xp: parseInt(eXp) || 0,
    };
    setSessions(copy);
    setEditIdx(null);
  };

  const removeSession = (i: number) => {
    if (!confirm("Eliminare questa sessione?")) return;
    setSessions(sessions.filter((_, idx) => idx !== i));
    setEditIdx(null);
  };

  const totalSpent = sessions.reduce((a, s) => a + s.spent, 0);
  const totalWon = sessions.reduce((a, s) => a + s.won, 0);
  const totalXp = sessions.reduce((a, s) => a + s.xp, 0);
  const net = totalWon - totalSpent;
  const netCost = totalSpent - totalWon;
  const costPerXp = totalXp > 0 && netCost > 0 ? netCost / totalXp : 0;
  const costoXpLabel = costPerXp <= 0 ? "0" : `${costPerXp.toFixed(2)} essenze per ogni XP`;

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      <div className="flex gap-3">
        <StatBox label="Essenze Nette" value={net} tone={net >= 0 ? "positive" : "negative"} />
        <StatBox label="Totale XP" value={totalXp} tone="info" />
      </div>
      <div className="flex gap-3">
        <StatBox
          label="COSTO PER XP (cumulativo)"
          value={costoXpLabel}
          tone={costPerXp <= 0 ? "positive" : "negative"}
        />
      </div>

      <Card>
        <SectionTitle>Registra Sessione — {title}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Essenze Spese</Label>
            <Input
              inputMode="numeric"
              value={spent}
              onChange={(e) => setSpent(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Essenze Vinte</Label>
            <Input
              inputMode="numeric"
              value={won}
              onChange={(e) => setWon(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>XP Guadagnati</Label>
            <Input
              inputMode="numeric"
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleLog}>Salva Sessione</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Storico Sessioni ({sessions.length})</SectionTitle>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna sessione registrata.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">#</th>
                  <th className="py-2">⚙️</th>
                  <th className="py-2">Spese</th>
                  <th className="py-2">Vinte</th>
                  <th className="py-2">XP</th>
                  <th className="py-2">Netto</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const n = s.won - s.spent;
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">{i + 1}</td>
                      <td className="py-2">
                        <button
                          onClick={() => startEdit(i)}
                          className="rounded-md border border-border px-1.5 py-1 text-xs hover:bg-secondary"
                        >
                          ✏️
                        </button>
                      </td>
                      <td className="py-2">{s.spent}</td>
                      <td className="py-2">{s.won}</td>
                      <td className="py-2 text-primary">{s.xp}</td>
                      <td
                        className={`py-2 font-semibold ${n >= 0 ? "text-accent" : "text-destructive"}`}
                      >
                        {n >= 0 ? "+" : ""}
                        {n}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editIdx != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditIdx(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-bold">Modifica Sessione — {title}</h3>
            <div className="grid gap-3">
              <div>
                <Label>Essenze Spese</Label>
                <Input
                  inputMode="numeric"
                  value={eSpent}
                  onChange={(e) => setESpent(e.target.value)}
                />
              </div>
              <div>
                <Label>Essenze Vinte</Label>
                <Input inputMode="numeric" value={eWon} onChange={(e) => setEWon(e.target.value)} />
              </div>
              <div>
                <Label>XP Guadagnati</Label>
                <Input inputMode="numeric" value={eXp} onChange={(e) => setEXp(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => removeSession(editIdx)}
                className="text-red-400 hover:text-red-300"
              >
                🗑️ Elimina
              </Button>
              <Button variant="ghost" onClick={() => setEditIdx(null)}>
                Annulla
              </Button>
              <Button variant="accent" onClick={saveEdit}>
                Salva
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
