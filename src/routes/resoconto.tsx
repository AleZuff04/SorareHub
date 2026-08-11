import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Label, PageTitle, SectionTitle, Tag } from "@/components/ui-kit";
import { useSorare, type CraftEntry, type Rarity, type Role } from "@/lib/sorare-store";

export const Route = createFileRoute("/resoconto")({
  component: ResocontoPage,
  head: () => ({
    meta: [
      { title: "Resoconto Stagione — Gestionale Sorare" },
      { name: "description", content: "Ricariche al netto delle commissioni, vincite cash, netto stagione, carte vinte e storico craft del tuo club Sorare." },
      { property: "og:title", content: "Resoconto Stagione — Gestionale Sorare" },
      { property: "og:description", content: "Bilancio della stagione: ricariche nette, vincite cash, carte vinte e craft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const RARITY_EMOJI: Record<Rarity, string> = { LIMITED: "🟡", RARE: "🔴", SR: "🔵", UNIQUE: "⚫️" };
const RARITIES: Rarity[] = ["LIMITED", "RARE", "SR", "UNIQUE"];
const ROLES: Role[] = ["GK", "DF", "MD", "FW"];
const SEASONS = ["26/27", "25/26", "24/25", "23/24", "22/23", "21/22", "20/21", "19/20", "18/19"];
const FEE = 0.05;

const selectClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
function monthKeys() {
  const out: { key: string; label: string }[] = [];
  for (const y of [2026, 2027]) {
    for (let m = 0; m < 12; m++) out.push({ key: `${y}-${String(m + 1).padStart(2, "0")}`, label: `${MONTHS[m]} ${String(y).slice(2)}` });
  }
  return out;
}

function ResocontoPage() {
  const { winLog, ricariche, setRicariche, wonCards, crafts, setCrafts, cards, setCards, competitions } = useSorare();
  const [rAmount, setRAmount] = useState("");
  const [rDate, setRDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rNote, setRNote] = useState("");

  const ricaricheLorde = ricariche.reduce((s, r) => s + r.amount, 0);
  const ricaricheTotali = Number((ricaricheLorde * (1 - FEE)).toFixed(2));
  const vinciteTotali = winLog.reduce((s, w) => s + w.amount, 0);
  const netto = vinciteTotali - ricaricheTotali;

  const addRicarica = () => {
    const n = parseFloat(rAmount);
    if (!Number.isFinite(n) || n === 0) {
      toast.error("Inserisci un importo valido");
      return;
    }
    setRicariche([...ricariche, { amount: n, date: rDate || new Date().toISOString().slice(0, 10), note: rNote.trim() || undefined }]);
    setRAmount("");
    setRNote("");
    toast.success(`Ricarica di €${n.toFixed(2)} registrata (netto €${(n * (1 - FEE)).toFixed(2)})`);
  };

  const removeRicarica = (i: number) => {
    if (!confirm("Eliminare questa ricarica?")) return;
    setRicariche(ricariche.filter((_, idx) => idx !== i));
    toast.success("Ricarica eliminata");
  };

  // ---- Craft ----
  const [cDate, setCDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cName, setCName] = useState("");
  const [cSeason, setCSeason] = useState(SEASONS[0]!);
  const [cRarity, setCRarity] = useState<Rarity>("LIMITED");
  const [cRole, setCRole] = useState<Role>("GK");
  const [cSerial, setCSerial] = useState("");
  const [cValue, setCValue] = useState("");
  const [cEssRarity, setCEssRarity] = useState<Rarity>("LIMITED");
  const [cEssQty, setCEssQty] = useState("");
  const [cComp, setCComp] = useState("");

  const totalEss = crafts.reduce((s, c) => s + c.essQty, 0);
  const totalCraftValue = crafts.reduce((s, c) => s + c.value, 0);
  const avgPerEss = totalEss > 0 ? totalCraftValue / totalEss : 0;

  const craftHisto = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    for (const c of crafts) {
      const k = (c.date ?? "").slice(0, 7);
      const prev = map.get(k) ?? { value: 0, count: 0 };
      map.set(k, { value: prev.value + c.value, count: prev.count + 1 });
    }
    return monthKeys().map(({ key, label }) => ({
      month: label,
      value: Number((map.get(key)?.value ?? 0).toFixed(2)),
      count: map.get(key)?.count ?? 0,
    }));
  }, [crafts]);

  const addCraft = () => {
    const name = cName.trim();
    const value = parseFloat(cValue);
    const qty = parseFloat(cEssQty);
    if (!name) return toast.error("Inserisci il nome del giocatore");
    if (!Number.isFinite(value) || value < 0) return toast.error("Inserisci un valore valido");
    if (!Number.isFinite(qty) || qty <= 0) return toast.error("Inserisci la quantità di essenze spese");
    if (!cComp) return toast.error("Seleziona obbligatoriamente un tabellone");

    const entry: CraftEntry = {
      date: cDate,
      name,
      season: cSeason,
      rarity: cRarity,
      role: cRole,
      serial: cSerial.trim() || undefined,
      value: Number(value.toFixed(2)),
      essRarity: cEssRarity,
      essQty: qty,
      comp: cComp,
    };
    setCrafts([...crafts, entry]);
    setCards([
      ...cards,
      { name, season: cSeason, buy: 0, sell: null, comp: cComp, serial: cSerial.trim() || undefined, rarity: cRarity, role: cRole },
    ]);
    setCName("");
    setCSerial("");
    setCValue("");
    setCEssQty("");
    toast.success(`Craft registrato — ${name} aggiunto a ${cComp} con costo 0€`);
  };

  const removeCraft = (i: number) => {
    if (!confirm("Eliminare questo craft dallo storico?")) return;
    setCrafts(crafts.filter((_, idx) => idx !== i));
    toast.success("Craft eliminato");
  };

  return (
    <AppLayout title="Resoconto Stagione">
      <PageTitle
        badge={
          <span className={`rounded-full bg-secondary px-3 py-1 text-xs font-semibold ${netto >= 0 ? "text-accent" : "text-destructive"}`}>
            Netto: {netto >= 0 ? "+" : "-"}
            {Math.abs(netto).toFixed(2)}€
          </span>
        }
      >
        Resoconto Stagione
      </PageTitle>

      <Card>
        <SectionTitle>📅 Bilancio Stagione</SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Ricariche Totali (netto −5%)</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{ricaricheTotali.toFixed(2)}€</div>
            <div className="mt-1 text-xs text-muted-foreground">Lordo versato: {ricaricheLorde.toFixed(2)}€ · commissioni Sorare 5%</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Vincite Totali Cash</div>
            <div className="mt-1 text-2xl font-bold text-accent">{vinciteTotali.toFixed(2)}€</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-background/40 p-5 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Netto Stagione</div>
          <div className={`mt-1 text-4xl font-extrabold ${netto >= 0 ? "text-accent" : "text-destructive"}`}>
            {netto >= 0 ? "+" : "-"}
            {Math.abs(netto).toFixed(2)}€
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
          <div className="mb-2 text-sm font-semibold">➕ Nuova Ricarica</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Importo (€)</Label>
              <Input inputMode="decimal" value={rAmount} onChange={(e) => setRAmount(e.target.value)} placeholder="Es. 50" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} />
            </div>
            <div>
              <Label>Nota (facoltativa)</Label>
              <Input value={rNote} onChange={(e) => setRNote(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Button variant="accent" onClick={addRicarica}>Aggiungi Ricarica</Button>
          </div>

          {ricariche.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2">Data</th>
                    <th className="py-2">Nota</th>
                    <th className="py-2 text-right">Importo</th>
                    <th className="py-2 text-right">Netto −5%</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {ricariche.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2 whitespace-nowrap">{r.date}</td>
                      <td className="py-2 text-muted-foreground">{r.note ?? "—"}</td>
                      <td className="py-2 text-right">{r.amount.toFixed(2)}€</td>
                      <td className="py-2 text-right font-semibold">{(r.amount * (1 - FEE)).toFixed(2)}€</td>
                      <td className="py-2 text-right">
                        <button onClick={() => removeRicarica(i)} className="rounded-md border border-border px-1.5 py-1 text-xs hover:bg-secondary">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>🃏 Carte Vinte</SectionTitle>

        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Carte Vinte Totali</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{wonCards.length}</div>
        </div>

        <div className="mt-3">
          <div className="mb-2 text-sm font-semibold">Lista Carte Vinte</div>
          {wonCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna carta vinta registrata.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Nome</th>
                    <th className="px-3 py-2 text-left font-semibold">Stagione</th>
                    <th className="px-3 py-2 text-left font-semibold">Rarità</th>
                    <th className="px-3 py-2 text-left font-semibold">Ruolo</th>
                    <th className="px-3 py-2 text-left font-semibold">Seriale</th>
                    <th className="px-3 py-2 text-right font-semibold">Valore al Momento Della Vincita (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {wonCards.map((c, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.season}</td>
                      <td className="px-3 py-2">{c.rarity ? `${RARITY_EMOJI[c.rarity]} ${c.rarity}` : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.role ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.serial ? `#${c.serial}` : "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-accent">{c.value.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* ---------------- CRAFT ---------------- */}
      <Card>
        <SectionTitle>🛠️ Craft</SectionTitle>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Carte Craftate Totali</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{crafts.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Totale Essenze Spese</div>
            <div className="mt-1 text-2xl font-bold text-primary">{totalEss}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Valore Medio per Essenza</div>
            <div className="mt-1 text-2xl font-bold text-accent">{avgPerEss.toFixed(2)}€</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
          <div className="mb-2 text-sm font-semibold">➕ Nuovo Craft</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Data del Craft</Label>
              <Input type="date" value={cDate} onChange={(e) => setCDate(e.target.value)} />
            </div>
            <div>
              <Label>Nome Giocatore</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Es. Bouanga" />
            </div>
            <div>
              <Label>Stagione</Label>
              <select className={selectClass} value={cSeason} onChange={(e) => setCSeason(e.target.value)}>
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Rarità</Label>
              <select className={selectClass} value={cRarity} onChange={(e) => setCRarity(e.target.value as Rarity)}>
                {RARITIES.map((r) => <option key={r} value={r}>{RARITY_EMOJI[r]} {r}</option>)}
              </select>
            </div>
            <div>
              <Label>Ruolo</Label>
              <select className={selectClass} value={cRole} onChange={(e) => setCRole(e.target.value as Role)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <Label>Seriale</Label>
              <Input value={cSerial} onChange={(e) => setCSerial(e.target.value)} placeholder="Es. 123" />
            </div>
            <div>
              <Label>Valore al Momento del Craft (€)</Label>
              <Input inputMode="decimal" value={cValue} onChange={(e) => setCValue(e.target.value)} placeholder="Es. 12.50" />
            </div>
            <div>
              <Label>Tipo/Rarità Essenze Utilizzate</Label>
              <select className={selectClass} value={cEssRarity} onChange={(e) => setCEssRarity(e.target.value as Rarity)}>
                {RARITIES.map((r) => <option key={r} value={r}>{RARITY_EMOJI[r]} {r}</option>)}
              </select>
            </div>
            <div>
              <Label>Quantità Essenze Spese</Label>
              <Input inputMode="decimal" value={cEssQty} onChange={(e) => setCEssQty(e.target.value)} placeholder="Es. 40" />
            </div>
          </div>

          <div className="mt-3">
            <Label>Associa a Tabellone *</Label>
            {competitions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Crea prima un tabellone nella sezione Galleria &amp; Campionati.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {competitions.map((c) => (
                  <Tag key={c} active={cComp === c} onClick={() => setCComp(c)}>{c}</Tag>
                ))}
              </div>
            )}
            {!cComp && <div className="mt-2 text-xs text-muted-foreground">Seleziona obbligatoriamente un tabellone prima di salvare.</div>}
          </div>

          <div className="mt-4">
            <Button variant="accent" onClick={addCraft}>Registra Craft</Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold">Storico Carte Craftate</div>
          {crafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun craft registrato.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Data</th>
                    <th className="px-3 py-2 text-left font-semibold">Nome</th>
                    <th className="px-3 py-2 text-left font-semibold">Stagione</th>
                    <th className="px-3 py-2 text-left font-semibold">Rarità</th>
                    <th className="px-3 py-2 text-left font-semibold">Ruolo</th>
                    <th className="px-3 py-2 text-left font-semibold">Seriale</th>
                    <th className="px-3 py-2 text-left font-semibold">Tabellone</th>
                    <th className="px-3 py-2 text-left font-semibold">Essenze</th>
                    <th className="px-3 py-2 text-right font-semibold">Valore al Momento del Craft (€)</th>
                    <th className="px-3 py-2 text-right font-semibold">Valore per Essenza (€/Essenza)</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {crafts.map((c, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap">{c.date}</td>
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.season}</td>
                      <td className="px-3 py-2">{c.rarity ? `${RARITY_EMOJI[c.rarity]} ${c.rarity}` : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.role ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.serial ? `#${c.serial}` : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.comp}</td>
                      <td className="px-3 py-2">{RARITY_EMOJI[c.essRarity]} {c.essQty}</td>
                      <td className="px-3 py-2 text-right font-semibold text-accent">{c.value.toFixed(2)}€</td>
                      <td className="px-3 py-2 text-right font-semibold">{(c.essQty > 0 ? c.value / c.essQty : 0).toFixed(2)}€</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeCraft(i)} className="rounded-md border border-border px-1.5 py-1 text-xs hover:bg-secondary">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-2 text-sm font-semibold">📊 Valore Craft per Mese (2026 → 2027)</div>
          {crafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Il grafico si aggiorna automaticamente quando registri un craft.</p>
          ) : (
            <div className="h-72 w-full overflow-x-auto">
              <div className="h-full min-w-[720px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={craftHisto} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#e2e8f0" }}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={54}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#e2e8f0" }} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: number, _n: string, item: { payload?: { count?: number } }) => [
                        `${Number(v).toFixed(2)}€ · ${item?.payload?.count ?? 0} craft`,
                        "Valore craftato",
                      ]}
                    />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
