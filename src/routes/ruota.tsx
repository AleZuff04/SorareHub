import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Label, PageTitle, SectionTitle, Tag } from "@/components/ui-kit";
import { useSorare, type IndizioType, type Rarity, type Role, type WheelSpin } from "@/lib/sorare-store";

export const Route = createFileRoute("/ruota")({
  component: RuotaPage,
  head: () => ({
    meta: [
      { title: "Ruota — Gestionale Sorare" },
      { name: "description", content: "Registra i giri di ruota Sorare: essenze, XP, crediti mercato, carte Star e indizi, con totali e storico completo." },
      { property: "og:title", content: "Ruota — Gestionale Sorare" },
      { property: "og:description", content: "Contatore giri, premi accumulati e storico dei giri di ruota." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const RARITY_EMOJI: Record<Rarity, string> = { LIMITED: "🟡", RARE: "🔴", SR: "🔵", UNIQUE: "⚫️" };
const RARITIES: Rarity[] = ["LIMITED", "RARE", "SR", "UNIQUE"];
const ROLES: Role[] = ["GK", "DF", "MD", "FW"];
const SEASONS = ["26/27", "25/26", "24/25", "23/24", "22/23", "21/22", "20/21", "19/20", "18/19"];
const INDIZI: IndizioType[] = ["Best Five", "Livello più alto", "Competizione", "Paese"];

const selectClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm"
    >
      <span className="font-medium">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-accent" : "bg-secondary"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-all ${on ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function RuotaPage() {
  const { wheelSpins, setWheelSpins, cards, setCards, competitions } = useSorare();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [onEss, setOnEss] = useState(false);
  const [essRarity, setEssRarity] = useState<Rarity>("LIMITED");
  const [essQty, setEssQty] = useState("");
  const [onXp, setOnXp] = useState(false);
  const [xp, setXp] = useState("");
  const [onCred, setOnCred] = useState(false);
  const [cred, setCred] = useState("");
  const [onStar, setOnStar] = useState(false);
  const [sName, setSName] = useState("");
  const [sSeason, setSSeason] = useState(SEASONS[0]!);
  const [sRarity, setSRarity] = useState<Rarity>("LIMITED");
  const [sRole, setSRole] = useState<Role>("GK");
  const [sSerial, setSSerial] = useState("");
  const [sValue, setSValue] = useState("");
  const [sComp, setSComp] = useState("");
  const [onInd, setOnInd] = useState(false);
  const [indType, setIndType] = useState<IndizioType>("Best Five");
  const [indQty, setIndQty] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const totEss = wheelSpins.reduce((s, w) => s + (w.essences?.qty ?? 0), 0);
  const totXp = wheelSpins.reduce((s, w) => s + (w.xp ?? 0), 0);
  const totCred = wheelSpins.reduce((s, w) => s + (w.credits ?? 0), 0);
  const totStar = wheelSpins.filter((w) => w.star).length;
  const indCount = (t: IndizioType) => wheelSpins.reduce((s, w) => s + (w.indizi?.type === t ? w.indizi.qty : 0), 0);
  const totInd = wheelSpins.reduce((s, w) => s + (w.indizi?.qty ?? 0), 0);

  const resetForm = () => {
    setOnEss(false); setEssQty(""); setEssRarity("LIMITED");
    setOnXp(false); setXp("");
    setOnCred(false); setCred("");
    setOnStar(false); setSName(""); setSSerial(""); setSValue(""); setSComp("");
    setOnInd(false); setIndQty(""); setIndType("Best Five");
    setEditIdx(null);
  };

  const loadSpin = (i: number) => {
    const w = wheelSpins[i]!;
    setEditIdx(i);
    setDate(w.date);
    setOnEss(!!w.essences); setEssQty(w.essences ? String(w.essences.qty) : ""); setEssRarity(w.essences?.rarity ?? "LIMITED");
    setOnXp(w.xp != null); setXp(w.xp != null ? String(w.xp) : "");
    setOnCred(w.credits != null); setCred(w.credits != null ? String(w.credits) : "");
    setOnStar(!!w.star);
    setSName(w.star?.name ?? ""); setSSeason(w.star?.season ?? SEASONS[0]!);
    setSRarity(w.star?.rarity ?? "LIMITED"); setSRole(w.star?.role ?? "GK");
    setSSerial(w.star?.serial ?? ""); setSValue(w.star ? String(w.star.value) : ""); setSComp(w.star?.comp ?? "");
    setOnInd(!!w.indizi); setIndType(w.indizi?.type ?? "Best Five"); setIndQty(w.indizi ? String(w.indizi.qty) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = () => {
    if (!onEss && !onXp && !onCred && !onStar && !onInd) return toast.error("Attiva almeno un premio vinto");
    const spin: WheelSpin = { date };

    if (onEss) {
      const q = parseFloat(essQty);
      if (!Number.isFinite(q) || q <= 0) return toast.error("Inserisci la quantità di essenze");
      spin.essences = { rarity: essRarity, qty: q };
    }
    if (onXp) {
      const q = parseFloat(xp);
      if (!Number.isFinite(q) || q <= 0) return toast.error("Inserisci la quantità di XP");
      spin.xp = q;
    }
    if (onCred) {
      const q = parseFloat(cred);
      if (!Number.isFinite(q) || q <= 0) return toast.error("Inserisci la quantità di crediti");
      spin.credits = Number(q.toFixed(2));
    }
    if (onStar) {
      const name = sName.trim();
      const v = parseFloat(sValue);
      if (!name) return toast.error("Inserisci il nome del giocatore Star");
      if (!Number.isFinite(v) || v < 0) return toast.error("Inserisci il valore attuale del giocatore");
      if (!sComp) return toast.error("Seleziona obbligatoriamente un tabellone per la carta Star");
      spin.star = { name, season: sSeason, rarity: sRarity, role: sRole, serial: sSerial.trim() || undefined, value: Number(v.toFixed(2)), comp: sComp };
    }
    if (onInd) {
      const q = parseFloat(indQty);
      if (!Number.isFinite(q) || q <= 0) return toast.error("Inserisci la quantità di indizi");
      spin.indizi = { type: indType, qty: q };
    }

    if (editIdx != null) {
      setWheelSpins(wheelSpins.map((w, i) => (i === editIdx ? spin : w)));
      toast.success("Giro aggiornato");
    } else {
      setWheelSpins([...wheelSpins, spin]);
      if (spin.star) {
        setCards([
          ...cards,
          { name: spin.star.name, season: spin.star.season, buy: 0, sell: null, comp: spin.star.comp, serial: spin.star.serial, rarity: spin.star.rarity, role: spin.star.role },
        ]);
        toast.success(`Giro registrato — ${spin.star.name} aggiunto a ${spin.star.comp} con costo 0€`);
      } else {
        toast.success("Giro registrato");
      }
    }
    resetForm();
  };

  const remove = (i: number) => {
    if (!confirm("Eliminare questo giro dallo storico?")) return;
    setWheelSpins(wheelSpins.filter((_, idx) => idx !== i));
    if (editIdx === i) resetForm();
    toast.success("Giro eliminato");
  };

  const spinPrizes = (w: WheelSpin) => {
    const rows: { prize: string; detail: string; qty: string }[] = [];
    if (w.essences) rows.push({ prize: "Essenze", detail: w.essences.rarity ? `${RARITY_EMOJI[w.essences.rarity]} ${w.essences.rarity}` : "—", qty: String(w.essences.qty) });
    if (w.xp != null) rows.push({ prize: "XP", detail: "—", qty: String(w.xp) });
    if (w.credits != null) rows.push({ prize: "Crediti Mercato", detail: "—", qty: `${w.credits.toFixed(2)}€` });
    if (w.star) rows.push({
      prize: "Star ⭐⭐⭐⭐",
      detail: `${w.star.rarity ? RARITY_EMOJI[w.star.rarity] : ""} ${w.star.season} · ${w.star.role ?? "—"} · ${w.star.serial ? "#" + w.star.serial : "—"} · ${w.star.comp}`,
      qty: `${w.star.name} (${w.star.value.toFixed(2)}€)`,
    });
    if (w.indizi) rows.push({ prize: "Indizi", detail: w.indizi.type, qty: String(w.indizi.qty) });
    return rows;
  };

  return (
    <AppLayout title="Ruota">
      <PageTitle badge={<span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">Giri: {wheelSpins.length}</span>}>
        Ruota
      </PageTitle>

      <Card>
        <SectionTitle>🎯 Contatore Giri</SectionTitle>
        <div className="rounded-xl border border-border bg-background/40 p-5 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Giri di Ruota Totali</div>
          <div className="mt-1 text-4xl font-extrabold text-primary">{wheelSpins.length}</div>
        </div>
      </Card>

      <Card>
        <SectionTitle>{editIdx != null ? "✏️ Modifica Giro" : "➕ Registra Giro di Ruota"}</SectionTitle>

        <div className="max-w-xs">
          <Label>Data del Giro</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <Toggle label="Essenze" on={onEss} onChange={setOnEss} />
            {onEss && (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Tipo Essenze</Label>
                  <select className={selectClass} value={essRarity} onChange={(e) => setEssRarity(e.target.value as Rarity)}>
                    {RARITIES.map((r) => <option key={r} value={r}>{RARITY_EMOJI[r]} {r}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Quantità Essenze</Label>
                  <Input inputMode="decimal" value={essQty} onChange={(e) => setEssQty(e.target.value)} placeholder="Es. 20" />
                </div>
              </div>
            )}
          </div>

          <div>
            <Toggle label="XP" on={onXp} onChange={setOnXp} />
            {onXp && (
              <div className="mt-2 max-w-xs">
                <Label>Quantità XP</Label>
                <Input inputMode="decimal" value={xp} onChange={(e) => setXp(e.target.value)} placeholder="Es. 500" />
              </div>
            )}
          </div>

          <div>
            <Toggle label="Crediti Mercato" on={onCred} onChange={setOnCred} />
            {onCred && (
              <div className="mt-2 max-w-xs">
                <Label>Quantità Crediti (€/$)</Label>
                <Input inputMode="decimal" value={cred} onChange={(e) => setCred(e.target.value)} placeholder="Es. 5.00" />
              </div>
            )}
          </div>

          <div>
            <Toggle label="Star ⭐⭐⭐⭐" on={onStar} onChange={setOnStar} />
            {onStar && (
              <div className="mt-2 rounded-md border border-border bg-background/40 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nome</Label>
                    <Input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Es. Bouanga" />
                  </div>
                  <div>
                    <Label>Stagione</Label>
                    <select className={selectClass} value={sSeason} onChange={(e) => setSSeason(e.target.value)}>
                      {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Rarità</Label>
                    <select className={selectClass} value={sRarity} onChange={(e) => setSRarity(e.target.value as Rarity)}>
                      {RARITIES.map((r) => <option key={r} value={r}>{RARITY_EMOJI[r]} {r}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Ruolo</Label>
                    <select className={selectClass} value={sRole} onChange={(e) => setSRole(e.target.value as Role)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Seriale</Label>
                    <Input value={sSerial} onChange={(e) => setSSerial(e.target.value)} placeholder="Es. 123" />
                  </div>
                  <div>
                    <Label>Valore Attuale (€)</Label>
                    <Input inputMode="decimal" value={sValue} onChange={(e) => setSValue(e.target.value)} placeholder="Es. 12.50" />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Associa a Tabellone *</Label>
                  {competitions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Crea prima un tabellone nella sezione Galleria &amp; Campionati.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {competitions.map((c) => (
                        <Tag key={c} active={sComp === c} onClick={() => setSComp(c)}>{c}</Tag>
                      ))}
                    </div>
                  )}
                  {!sComp && <div className="mt-2 text-xs text-muted-foreground">Seleziona obbligatoriamente un tabellone.</div>}
                </div>
              </div>
            )}
          </div>

          <div>
            <Toggle label="Indizi" on={onInd} onChange={setOnInd} />
            {onInd && (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Tipo Indizio</Label>
                  <select className={selectClass} value={indType} onChange={(e) => setIndType(e.target.value as IndizioType)}>
                    {INDIZI.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Quantità Indizi</Label>
                  <Input inputMode="decimal" value={indQty} onChange={(e) => setIndQty(e.target.value)} placeholder="Es. 2" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="accent" onClick={save}>{editIdx != null ? "Salva Modifiche" : "Registra Giro"}</Button>
          {editIdx != null && <Button variant="ghost" onClick={resetForm}>Annulla</Button>}
        </div>
      </Card>

      <Card>
        <SectionTitle>🏆 Premi Acquisiti</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Totale Essenze Vinte</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{totEss}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Totale XP Vinti</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{totXp}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Totale Crediti Mercato Vinti</div>
            <div className="mt-1 text-2xl font-bold text-accent">{totCred.toFixed(2)}€</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Totale Carte Star ⭐⭐⭐⭐ Vinte</div>
            <div className="mt-1 text-2xl font-bold text-primary">{totStar}</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-background/40 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Totale Indizi Vinti</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{totInd}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {INDIZI.map((t) => (
              <div key={t} className="rounded-md border border-border bg-card px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{t}</div>
                <div className="text-lg font-semibold">{indCount(t)}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>📜 Storico Giri di Ruota</SectionTitle>
        {wheelSpins.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun giro registrato.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Data Giro</th>
                  <th className="px-3 py-2 text-left font-semibold">Premio Vinto</th>
                  <th className="px-3 py-2 text-left font-semibold">Dettagli/Tipo</th>
                  <th className="px-3 py-2 text-left font-semibold">Quantità/Giocatore</th>
                  <th className="px-3 py-2 text-right font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {wheelSpins.map((w, i) => {
                  const rows = spinPrizes(w);
                  return rows.map((r, j) => (
                    <tr key={`${i}-${j}`} className="border-t border-border">
                      {j === 0 && <td className="px-3 py-2 whitespace-nowrap align-top" rowSpan={rows.length}>{w.date}</td>}
                      <td className="px-3 py-2 font-medium">{r.prize}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.detail}</td>
                      <td className="px-3 py-2">{r.qty}</td>
                      {j === 0 && (
                        <td className="px-3 py-2 text-right align-top whitespace-nowrap" rowSpan={rows.length}>
                          <button onClick={() => loadSpin(i)} className="mr-1 rounded-md border border-border px-1.5 py-1 text-xs hover:bg-secondary">✏️</button>
                          <button onClick={() => remove(i)} className="rounded-md border border-border px-1.5 py-1 text-xs hover:bg-secondary">🗑️</button>
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
