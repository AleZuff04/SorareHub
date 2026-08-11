import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Label, PageTitle, SectionTitle, Tag } from "@/components/ui-kit";
import { useSorare, type PremiMap, type Rarity, type Role } from "@/lib/sorare-store";

export const Route = createFileRoute("/")({
  component: GalleriaPage,
});

const RARITIES: Rarity[] = ["LIMITED", "RARE", "SR", "UNIQUE"];
const ROLES: Role[] = ["GK", "DF", "MD", "FW"];
const SEASONS = ["26/27", "25/26", "24/25", "23/24", "22/23", "21/22", "20/21", "19/20", "18/19"];

const selectClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

function compSlug(name: string) {
  return (
    "tab-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function compAbbr(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map((w) => w[0]!.toUpperCase()).join(".") + ".";
  const w = (words[0] ?? "").toUpperCase();
  if (w.length <= 4) return w;
  return w.slice(0, 4) + ".";
}

function QuickJump({ competitions }: { competitions: string[] }) {
  if (competitions.length === 0) return null;
  return (
    <div className="fixed right-2 top-1/2 z-40 -translate-y-1/2 flex flex-col gap-1.5">
      {competitions.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          aria-label={`Vai al tabellone ${c}`}
          onClick={() =>
            document
              .getElementById(compSlug(c))
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="group relative grid h-10 w-10 place-items-center rounded-md border border-border bg-card/90 text-[10px] font-bold text-muted-foreground shadow-md backdrop-blur transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <span className="px-0.5 leading-none truncate">{compAbbr(c)}</span>
          <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground shadow-lg group-hover:block">
            {c}
          </span>
        </button>
      ))}
    </div>
  );
}

function GalleriaPage() {
  const { cards, setCards, competitions, setCompetitions, premi, setPremi } = useSorare();
  const [newComp, setNewComp] = useState("");
  const [pName, setPName] = useState("");
  const [pSeason, setPSeason] = useState("");
  const [pBuy, setPBuy] = useState("");
  const [pCreditsOn, setPCreditsOn] = useState(false);
  const [pCredits, setPCredits] = useState("");
  const [pSerial, setPSerial] = useState("");
  const [pRarity, setPRarity] = useState<Rarity>("LIMITED");
  const [pRole, setPRole] = useState<Role>("GK");
  const [pComp, setPComp] = useState<string>("");
  const [pMode, setPMode] = useState<"direct" | "swap">("direct");
  const [pSwapCash, setPSwapCash] = useState("");
  const [pSwapCashRecv, setPSwapCashRecv] = useState("");
  type SwapRow = {
    name: string;
    season: string;
    serial: string;
    value: string;
    rarity: Rarity;
    role: Role;
  };
  const emptySwap = (): SwapRow => ({
    name: "",
    season: "",
    serial: "",
    value: "",
    rarity: "LIMITED",
    role: "GK",
  });
  const [pSwapRows, setPSwapRows] = useState<SwapRow[]>([emptySwap()]);
  type RecvRow = {
    name: string;
    season: string;
    serial: string;
    value: string;
    rarity: Rarity;
    role: Role;
  };
  const emptyRecv = (): RecvRow => ({
    name: "",
    season: "",
    serial: "",
    value: "",
    rarity: "LIMITED",
    role: "GK",
  });
  const [pRecvRows, setPRecvRows] = useState<RecvRow[]>([emptyRecv()]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [eSeason, setESeason] = useState("");
  const [eBuy, setEBuy] = useState("");
  const [eSell, setESell] = useState("");
  const [eSerial, setESerial] = useState("");
  const [eRarity, setERarity] = useState<Rarity>("LIMITED");
  const [eRole, setERole] = useState<Role>("GK");
  const [eComp, setEComp] = useState("");
  const [search, setSearch] = useState<Record<string, string>>({});
  const [rarityFilter, setRarityFilter] = useState<Record<string, "ALL" | Rarity>>({});
  const [seasonFilter, setSeasonFilter] = useState<Record<string, string>>({});
  const [roleFilter, setRoleFilter] = useState<Record<string, "ALL" | Role>>({});
  const [dupError, setDupError] = useState<string | null>(null);

  const handleAddCard = () => {
    if (!pComp || !competitions.includes(pComp)) {
      setDupError("⛔ Seleziona un tabellone (competizione) a cui associare la carta.");
      setTimeout(() => setDupError(null), 4000);
      return;
    }
    if (pMode === "direct" && !pName) return;
    if (pMode === "direct" && !pBuy) return;
    const normLC = (v: string) => v.trim().toLowerCase();
    let remainingCards = cards;

    if (pMode === "direct") {
      const name = pName.trim();
      const season = (pSeason || "25/26").trim();
      const serial = pSerial.trim();
      const duplicate = cards.some(
        (c) =>
          normLC(c.name) === normLC(name) &&
          normLC(c.season) === normLC(season) &&
          normLC(c.serial ?? "") === normLC(serial),
      );
      if (duplicate) {
        setDupError(`⛔ Carta già presente: ${name} (${season})${serial ? ` #${serial}` : ""}`);
        toast.error(`Carta già presente: ${name} (${season})`);
        setTimeout(() => setDupError(null), 4000);
        return;
      }
      const nominal = parseFloat(pBuy) || 0;
      const creditsUsed = pCreditsOn ? parseFloat(pCredits) || 0 : 0;
      const buyValue = parseFloat((nominal - creditsUsed).toFixed(2));
      setCards([
        ...remainingCards,
        {
          name,
          season,
          buy: buyValue,
          sell: null,
          comp: pComp,
          serial: serial || undefined,
          rarity: pRarity,
          role: pRole,
        },
      ]);
      toast.success(`${name} aggiunto in ${pComp} · €${buyValue.toFixed(2)}`);
    } else {
      const cashPart = parseFloat(pSwapCash) || 0;
      const cashRecvPart = parseFloat(pSwapCashRecv) || 0;
      const filledPlayers = pSwapRows
        .filter((r) => r.name.trim() !== "")
        .map((r) => ({
          name: r.name.trim(),
          season: r.season.trim(),
          serial: r.serial.trim(),
          value: parseFloat(r.value) || 0,
          rarity: r.rarity,
          role: r.role,
        }));
      const playersPart = filledPlayers.reduce((s, r) => s + r.value, 0);
      const totalCounterparty = cashPart + playersPart - cashRecvPart;
      const swapDetail = { cash: cashPart, cashReceived: cashRecvPart, players: filledPlayers };

      const receivedRows = pRecvRows.filter((r) => r.name.trim() !== "");
      if (receivedRows.length === 0) {
        setDupError("⛔ Aggiungi almeno un giocatore ricevuto nello scambio.");
        setTimeout(() => setDupError(null), 4000);
        return;
      }

      remainingCards = remainingCards.map((c) => {
        if (c.sell != null) return c;
        const match = filledPlayers.find(
          (p) =>
            normLC(p.name) === normLC(c.name) &&
            (p.season === "" || normLC(p.season) === normLC(c.season)) &&
            normLC(p.serial) === normLC(c.serial ?? ""),
        );
        if (!match) return c;
        return { ...c, sell: match.value || 0 };
      });

      for (const r of receivedRows) {
        const rn = r.name.trim();
        const rs = (r.season || "25/26").trim();
        const rSerial = r.serial.trim();
        const dup = remainingCards.some(
          (c) =>
            normLC(c.name) === normLC(rn) &&
            normLC(c.season) === normLC(rs) &&
            normLC(c.serial ?? "") === normLC(rSerial),
        );
        if (dup) {
          setDupError(`⛔ Carta già presente: ${rn} (${rs})${rSerial ? ` #${rSerial}` : ""}`);
          setTimeout(() => setDupError(null), 4000);
          return;
        }
      }

      const receivedValuesSum = receivedRows.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
      const delta = (totalCounterparty - receivedValuesSum) / receivedRows.length;
      const newCards = receivedRows.map((r) => {
        const vDuringSwap = parseFloat(r.value) || 0;
        return {
          name: r.name.trim(),
          season: (r.season || "25/26").trim(),
          buy: vDuringSwap + delta,
          sell: null as number | null,
          comp: pComp,
          serial: r.serial.trim() || undefined,
          rarity: r.rarity,
          role: r.role,
          swap: swapDetail,
        };
      });
      setCards([...remainingCards, ...newCards]);
      toast.success(`Scambio registrato: ${newCards.length} carte ricevute`);
    }
    setPName("");
    setPBuy("");
    setPCreditsOn(false);
    setPCredits("");
    setPSeason("");
    setPSerial("");
    setPRarity("LIMITED");
    setPRole("GK");
    setPSwapCash("");
    setPSwapCashRecv("");
    setPSwapRows([emptySwap()]);
    setPRecvRows([emptyRecv()]);
    setPMode("direct");
    setPComp("");
    setDupError(null);
  };

  const updateSwapRow = (idx: number, patch: Partial<SwapRow>) => {
    setPSwapRows((rows) => {
      const next = rows.slice();
      next[idx] = { ...next[idx], ...patch };
      if (patch.name !== undefined) {
        const match = cards.find(
          (c) => c.name.trim().toLowerCase() === patch.name!.trim().toLowerCase(),
        );
        if (match) {
          next[idx].season = match.season;
          next[idx].serial = match.serial ?? "";
          if (match.rarity) next[idx].rarity = match.rarity;
          if (match.role) next[idx].role = match.role;
        }
      }
      const lastFilled = next[next.length - 1]?.name.trim() !== "";
      if (lastFilled && next.length < 10) next.push(emptySwap());
      return next;
    });
  };

  const removeSwapRow = (idx: number) => {
    setPSwapRows((rows) => {
      if (rows.length === 1) return [emptySwap()];
      return rows.filter((_, i) => i !== idx);
    });
  };

  const updateRecvRow = (idx: number, patch: Partial<RecvRow>) => {
    setPRecvRows((rows) => {
      const next = rows.slice();
      next[idx] = { ...next[idx], ...patch };
      const lastFilled = next[next.length - 1]?.name.trim() !== "";
      if (lastFilled && next.length < 10) next.push(emptyRecv());
      return next;
    });
  };

  const removeRecvRow = (idx: number) => {
    setPRecvRows((rows) => {
      if (rows.length === 1) return [emptyRecv()];
      return rows.filter((_, i) => i !== idx);
    });
  };

  const uniquePlayerNames = Array.from(new Set(cards.map((c) => c.name))).sort();

  const handleAddComp = () => {
    const v = newComp.trim();
    if (!v || competitions.includes(v)) return;
    setCompetitions([...competitions, v]);
    setNewComp("");
    toast.success(`Campionato "${v}" creato`);
  };

  const renameComp = (oldName: string) => {
    const raw = window.prompt("Nuovo nome per il campionato:", oldName);
    if (raw == null) return;
    const v = raw.trim();
    if (!v || v === oldName) return;
    if (competitions.includes(v)) {
      window.alert(`Esiste già un campionato chiamato "${v}".`);
      return;
    }
    setCompetitions(competitions.map((c) => (c === oldName ? v : c)));
    setCards(cards.map((c) => (c.comp === oldName ? { ...c, comp: v } : c)));
    const nextPremi: PremiMap = {};
    for (const [k, val] of Object.entries(premi)) {
      if (k === `${oldName}_Streak`) nextPremi[`${v}_Streak`] = val;
      else if (k === `${oldName}_Leaderboard`) nextPremi[`${v}_Leaderboard`] = val;
      else nextPremi[k] = val;
    }
    setPremi(nextPremi);
    if (pComp === oldName) setPComp(v);
    toast.success(`Campionato rinominato in "${v}"`);
  };

  const deleteComp = (name: string) => {
    const inUse = cards.some((c) => c.comp === name);
    const msg = inUse
      ? `Il campionato "${name}" contiene delle carte. Eliminarlo rimuoverà anche quelle carte. Continuare?`
      : `Eliminare il campionato "${name}"?`;
    if (!window.confirm(msg)) return;
    setCompetitions(competitions.filter((c) => c !== name));
    if (inUse) setCards(cards.filter((c) => c.comp !== name));
    const nextPremi: PremiMap = {};
    for (const [k, val] of Object.entries(premi)) {
      if (k === `${name}_Streak` || k === `${name}_Leaderboard`) continue;
      nextPremi[k] = val;
    }
    setPremi(nextPremi);
    if (pComp === name) {
      const remaining = competitions.filter((c) => c !== name);
      setPComp(remaining[0] ?? "");
    }
    toast.success(`Campionato "${name}" eliminato`);
  };

  const openEdit = (idx: number) => {
    const c = cards[idx];
    setEditIdx(idx);
    setEName(c.name);
    setESeason(c.season);
    setEBuy(String(c.buy));
    setESell(c.sell != null ? String(c.sell) : "");
    setESerial(c.serial ?? "");
    setERarity(c.rarity ?? "LIMITED");
    setERole(c.role ?? "GK");
    setEComp(c.comp);
  };

  const closeEdit = () => setEditIdx(null);

  const saveEdit = () => {
    if (editIdx == null) return;
    const sellNum = eSell.trim() === "" ? null : parseFloat(eSell);
    const next = cards.slice();
    const prevComp = next[editIdx].comp;
    const targetComp = eComp && competitions.includes(eComp) ? eComp : prevComp;
    next[editIdx] = {
      ...next[editIdx],
      name: eName || next[editIdx].name,
      season: eSeason || next[editIdx].season,
      buy: parseFloat(eBuy) || next[editIdx].buy,
      sell: sellNum,
      serial: eSerial.trim() || undefined,
      rarity: eRarity,
      role: eRole,
      comp: targetComp,
    };
    setCards(next);
    setEditIdx(null);
    toast.success(
      targetComp !== prevComp
        ? `${next[editIdx].name} spostato in ${targetComp}`
        : `${next[editIdx].name} aggiornato`,
    );
  };

  const removeCard = (idx: number) => {
    const c = cards[idx];
    setCards(cards.filter((_, i) => i !== idx));
    toast.success(`${c?.name ?? "Carta"} rimosso dalla galleria`);
  };

  const owned = cards.filter((c) => c.sell == null);
  const totalSpesa = owned.reduce((s, c) => s + (c.buy || 0), 0);

  return (
    <AppLayout title="Galleria & Campionati">
      <PageTitle
        badge={
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {owned.length} Carte
          </span>
        }
      >
        Galleria & Competizioni
      </PageTitle>

      <datalist id="seasons-list">
        {SEASONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="flex gap-3">
        <div className="flex-1 rounded-xl border border-primary/40 bg-primary/10 p-4">
          <div className="text-xs text-muted-foreground">💰 Spesa Totale Database</div>
          <div className="mt-1 text-2xl font-bold text-primary">€{totalSpesa.toFixed(2)}</div>
        </div>
      </div>

      <Card>
        <SectionTitle>Aggiungi Competizione</SectionTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Es. Challenger Europe"
            value={newComp}
            onChange={(e) => setNewComp(e.target.value)}
          />
          <Button onClick={handleAddComp}>Crea Campionato</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Inserisci Nuove Carte</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {pMode === "direct" && (
            <>
              <div>
                <Label>Nome Giocatore</Label>
                <Input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="Es. Petar Musa"
                />
              </div>
              <div>
                <Label>Stagione</Label>
                <Input
                  list="seasons-list"
                  value={pSeason}
                  onChange={(e) => setPSeason(e.target.value)}
                  placeholder="25/26"
                />
              </div>
              <div>
                <Label>Rarità</Label>
                <select
                  value={pRarity}
                  onChange={(e) => setPRarity(e.target.value as Rarity)}
                  className={selectClass}
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Ruolo</Label>
                <select
                  value={pRole}
                  onChange={(e) => setPRole(e.target.value as Role)}
                  className={selectClass}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label>Modalità di acquisto</Label>
            <select
              value={pMode}
              onChange={(e) => setPMode(e.target.value as "direct" | "swap")}
              className={selectClass}
            >
              <option value="direct">Acquisto diretto (€)</option>
              <option value="swap">Scambio</option>
            </select>
          </div>
          {pMode === "direct" ? (
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Prezzo Acquisto (€)</Label>
                <Input
                  inputMode="decimal"
                  value={pBuy}
                  onChange={(e) => setPBuy(e.target.value)}
                  placeholder="35"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Label>Crediti Usati</Label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pCreditsOn}
                    aria-label="Attiva Crediti Usati"
                    onClick={() => setPCreditsOn(!pCreditsOn)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${pCreditsOn ? "bg-primary" : "bg-secondary"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${pCreditsOn ? "left-4.5" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <Input
                  inputMode="decimal"
                  value={pCredits}
                  onChange={(e) => setPCredits(e.target.value)}
                  placeholder="0"
                  disabled={!pCreditsOn}
                  className={pCreditsOn ? "" : "opacity-50"}
                />
                {pCreditsOn && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Costo effettivo salvato: €
                    {((parseFloat(pBuy) || 0) - (parseFloat(pCredits) || 0)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="sm:col-span-2 space-y-4">
              <div>
                <Label>€ Dati</Label>
                <Input
                  inputMode="decimal"
                  value={pSwapCash}
                  onChange={(e) => setPSwapCash(e.target.value)}
                  placeholder="0"
                  className="max-w-[160px]"
                />
              </div>
              <div>
                <Label>Giocatori dati via (max 10)</Label>
                <datalist id="swap-players-list">
                  {uniquePlayerNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <div className="space-y-2">
                  {pSwapRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_90px_90px_90px_auto] gap-2 rounded-md border border-border bg-background/40 p-2"
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          🔍
                        </span>
                        <Input
                          list="swap-players-list"
                          placeholder="Giocatore"
                          value={row.name}
                          onChange={(e) => updateSwapRow(idx, { name: e.target.value })}
                          className="pl-6"
                        />
                      </div>
                      <Input
                        placeholder="Stagione"
                        list="seasons-list"
                        value={row.season}
                        onChange={(e) => updateSwapRow(idx, { season: e.target.value })}
                      />
                      <Input
                        placeholder="Seriale"
                        value={row.serial}
                        onChange={(e) => updateSwapRow(idx, { serial: e.target.value })}
                      />
                      <select
                        value={row.rarity}
                        onChange={(e) => updateSwapRow(idx, { rarity: e.target.value as Rarity })}
                        className={selectClass}
                      >
                        {RARITIES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <select
                        value={row.role}
                        onChange={(e) => updateSwapRow(idx, { role: e.target.value as Role })}
                        className={selectClass}
                        aria-label="Ruolo"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <Input
                        inputMode="decimal"
                        placeholder="Valore €"
                        value={row.value}
                        onChange={(e) => updateSwapRow(idx, { value: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        onClick={() => removeSwapRow(idx)}
                        className="!px-2 !py-1 text-xs"
                        aria-label="Rimuovi riga"
                        type="button"
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Giocatori ricevuti (max 10)</Label>
                <div className="space-y-2">
                  {pRecvRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_90px_90px_110px_auto] gap-2 rounded-md border border-primary/30 bg-primary/5 p-2"
                    >
                      <Input
                        placeholder="Nome Giocatore"
                        value={row.name}
                        onChange={(e) => updateRecvRow(idx, { name: e.target.value })}
                      />
                      <Input
                        placeholder="Stagione"
                        list="seasons-list"
                        value={row.season}
                        onChange={(e) => updateRecvRow(idx, { season: e.target.value })}
                      />
                      <Input
                        placeholder="Seriale"
                        value={row.serial}
                        onChange={(e) => updateRecvRow(idx, { serial: e.target.value })}
                      />
                      <select
                        value={row.rarity}
                        onChange={(e) => updateRecvRow(idx, { rarity: e.target.value as Rarity })}
                        className={selectClass}
                      >
                        {RARITIES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <select
                        value={row.role}
                        onChange={(e) => updateRecvRow(idx, { role: e.target.value as Role })}
                        className={selectClass}
                        aria-label="Ruolo"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <Input
                        inputMode="decimal"
                        placeholder="Valore Durante Scambio €"
                        value={row.value}
                        onChange={(e) => updateRecvRow(idx, { value: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        onClick={() => removeRecvRow(idx)}
                        className="!px-2 !py-1 text-xs"
                        aria-label="Rimuovi riga"
                        type="button"
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>€ Ricevuti</Label>
                <Input
                  inputMode="decimal"
                  value={pSwapCashRecv}
                  onChange={(e) => setPSwapCashRecv(e.target.value)}
                  placeholder="0"
                  className="max-w-[160px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Contropartita netta: €
                {(
                  (parseFloat(pSwapCash) || 0) +
                  pSwapRows.reduce((s, r) => s + (parseFloat(r.value) || 0), 0) -
                  (parseFloat(pSwapCashRecv) || 0)
                ).toFixed(2)}
                . A ogni giocatore ricevuto verrà sommato (contropartita − somma dei valori durante
                scambio) ÷ N ricevuti.
              </p>
            </div>
          )}
          {pMode === "direct" && (
            <div className="sm:col-span-2">
              <Label>Seriale</Label>
              <Input
                value={pSerial}
                onChange={(e) => setPSerial(e.target.value)}
                placeholder="Es. #123"
              />
            </div>
          )}
        </div>
        <div className="mt-3">
          <Label>Associa a Competizione *</Label>
          <div className="flex flex-wrap gap-2">
            {competitions.map((c) => (
              <Tag key={c} active={pComp === c} onClick={() => setPComp(c)}>
                {c}
              </Tag>
            ))}
          </div>
          {!pComp && (
            <div className="mt-2 text-xs text-muted-foreground">
              Seleziona obbligatoriamente un tabellone prima di aggiungere la carta.
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button variant="accent" onClick={handleAddCard}>
            Aggiungi in Galleria
          </Button>
        </div>
        {dupError && (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {dupError}
          </div>
        )}
      </Card>

      {competitions.map((compName) => {
        const q = (search[compName] ?? "").trim().toLowerCase();
        const rFilter = rarityFilter[compName] ?? "ALL";
        const sFilter = seasonFilter[compName] ?? "ALL";
        const roFilter = roleFilter[compName] ?? "ALL";
        const allComp = cards
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => c.comp === compName && c.sell == null);
        const compSpesa = allComp.reduce((s, { c }) => s + (c.buy || 0), 0);
        const list = allComp.filter(({ c }) => {
          if (q && ![c.name, c.serial ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
          if (rFilter !== "ALL" && (c.rarity ?? "LIMITED") !== rFilter) return false;
          if (sFilter !== "ALL" && c.season !== sFilter) return false;
          if (roFilter !== "ALL" && (c.role ?? "GK") !== roFilter) return false;
          return true;
        });
        return (
          <div key={compName} id={compSlug(compName)} className="scroll-mt-20">
            <Card>
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-lg font-bold min-w-0 truncate">🏆 Tabellone {compName}</h3>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {allComp.length} carte · €{compSpesa.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => renameComp(compName)}
                    className="!px-2 !py-1 text-xs"
                    aria-label={`Rinomina ${compName}`}
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => deleteComp(compName)}
                    className="!px-2 !py-1 text-xs !text-destructive"
                    aria-label={`Elimina ${compName}`}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-1 sm:grid-cols-[1fr_140px_140px_140px] gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    🔍
                  </span>
                  <Input
                    placeholder={`Cerca in ${compName} (nome o seriale)`}
                    value={search[compName] ?? ""}
                    onChange={(e) => setSearch({ ...search, [compName]: e.target.value })}
                    className="pl-8"
                  />
                </div>
                <select
                  value={rFilter}
                  onChange={(e) =>
                    setRarityFilter({
                      ...rarityFilter,
                      [compName]: e.target.value as "ALL" | Rarity,
                    })
                  }
                  className={selectClass}
                  aria-label="Filtra per rarità"
                >
                  <option value="ALL">Rarità: TUTTE</option>
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={sFilter}
                  onChange={(e) => setSeasonFilter({ ...seasonFilter, [compName]: e.target.value })}
                  className={selectClass}
                  aria-label="Filtra per stagione"
                >
                  <option value="ALL">Stagione: TUTTE</option>
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={roFilter}
                  onChange={(e) =>
                    setRoleFilter({ ...roleFilter, [compName]: e.target.value as "ALL" | Role })
                  }
                  className={selectClass}
                  aria-label="Filtra per ruolo"
                >
                  <option value="ALL">Tutti i ruoli</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {allComp.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna carta in questo campionato.</p>
              ) : list.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessuna carta trovata con i filtri selezionati.
                </p>
              ) : (
                <div className="space-y-2">
                  {list.map(({ c: card, i }) => (
                    <div
                      key={i}
                      className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0">
                          <span className="font-medium">{card.name}</span>{" "}
                          <span className="text-muted-foreground">({card.season})</span>
                          {card.rarity && (
                            <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                              {card.rarity}
                            </span>
                          )}
                          {card.serial && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              #{card.serial}
                            </span>
                          )}
                          {card.swap && (
                            <span className="ml-2 text-xs font-semibold text-accent">
                              (€{card.buy.toFixed(2)})
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {card.swap ? (
                            <>
                              <span className="font-semibold text-accent">
                                €{card.buy.toFixed(2)}
                              </span>
                              <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                                🔄 Scambio
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-accent">
                              In: {card.buy.toFixed(2)}€
                            </span>
                          )}
                          {card.sell != null && (
                            <span className="text-xs text-muted-foreground">
                              Out: {card.sell.toFixed(2)}€
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => openEdit(i)}
                            className="!px-2 !py-1 text-xs"
                          >
                            ✏️ Modifica
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => removeCard(i)}
                            className="!px-2 !py-1 text-xs !text-destructive"
                            aria-label={`Rimuovi ${card.name}`}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      {card.swap && (
                        <div className="mt-2 rounded border border-border/60 bg-background/40 p-2 text-xs">
                          <div className="mb-1 text-muted-foreground">
                            💶 Soldi dati:{" "}
                            <span className="font-semibold text-foreground">
                              €{card.swap.cash.toFixed(2)}
                            </span>
                            {card.swap.cashReceived != null && card.swap.cashReceived > 0 && (
                              <>
                                {" · "}💰 Soldi ricevuti:{" "}
                                <span className="font-semibold text-foreground">
                                  €{card.swap.cashReceived.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                          {card.swap.players.length > 0 ? (
                            <ul className="space-y-0.5">
                              {card.swap.players.map((p, k) => (
                                <li key={k} className="flex flex-wrap gap-x-2">
                                  <span className="font-medium">{p.name}</span>
                                  {p.season && (
                                    <span className="text-muted-foreground">({p.season})</span>
                                  )}
                                  {p.rarity && (
                                    <span className="text-muted-foreground">[{p.rarity}]</span>
                                  )}
                                  {p.serial && (
                                    <span className="text-muted-foreground">#{p.serial}</span>
                                  )}
                                  <span className="ml-auto text-accent">€{p.value.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-muted-foreground">
                              Nessun giocatore nello scambio.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        );
      })}

      <QuickJump competitions={competitions} />

      {editIdx != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeEdit} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-bold">Modifica Giocatore</h3>
            <div className="grid gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={eName} onChange={(e) => setEName(e.target.value)} />
              </div>
              <div>
                <Label>Stagione</Label>
                <Input
                  list="seasons-list"
                  value={eSeason}
                  onChange={(e) => setESeason(e.target.value)}
                />
              </div>
              <div>
                <Label>Rarità</Label>
                <select
                  value={eRarity}
                  onChange={(e) => setERarity(e.target.value as Rarity)}
                  className={selectClass}
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Ruolo</Label>
                <select
                  value={eRole}
                  onChange={(e) => setERole(e.target.value as Role)}
                  className={selectClass}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Prezzo Acquisto (€)</Label>
                <Input inputMode="decimal" value={eBuy} onChange={(e) => setEBuy(e.target.value)} />
              </div>
              <div>
                <Label>Prezzo Vendita (€) — lascia vuoto se non venduta</Label>
                <Input
                  inputMode="decimal"
                  value={eSell}
                  onChange={(e) => setESell(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Seriale</Label>
                <Input
                  value={eSerial}
                  onChange={(e) => setESerial(e.target.value)}
                  placeholder="Es. #123"
                />
              </div>
              <div>
                <Label>Tabellone (competizione)</Label>
                <select
                  value={eComp}
                  onChange={(e) => setEComp(e.target.value)}
                  className={selectClass}
                >
                  {competitions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeEdit}>
                Annulla
              </Button>
              <Button variant="accent" onClick={saveEdit}>
                Salva
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
