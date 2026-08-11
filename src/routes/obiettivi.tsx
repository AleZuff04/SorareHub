import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Label, PageTitle, Row, SectionTitle, Tag } from "@/components/ui-kit";
import { useSorare, type Rarity, type Role } from "@/lib/sorare-store";

export const Route = createFileRoute("/obiettivi")({
  head: () => ({ meta: [{ title: "Obiettivi & ROI — Sorare Manager" }] }),
  component: ObiettiviPage,
});

const SEASONS = ["26/27", "25/26", "24/25", "23/24", "22/23", "21/22", "20/21", "19/20", "18/19"];
const RARITIES: Rarity[] = ["LIMITED", "RARE", "SR", "UNIQUE"];
const ROLES: Role[] = ["GK", "DF", "MD", "FW"];
const RARITY_EMOJI: Record<Rarity, string> = { LIMITED: "🟡", RARE: "🔴", SR: "🔵", UNIQUE: "⚫️" };

const QUINT_LABELS: (Role | "EXTRA")[] = ["GK", "DF", "MD", "FW", "EXTRA"];
const ALLSTAR_LABELS: (Role | "EXTRA")[] = ["GK", "DF", "DF", "MD", "MD", "FW", "EXTRA"];

function ObiettiviPage() {
  const {
    premi,
    setPremi,
    roi,
    setRoi,
    cards,
    setCards,
    competitions,
    winLog,
    setWinLog,
    wonCards,
    setWonCards,
  } = useSorare();
  // Totali vincite cash derivati ESCLUSIVAMENTE dalla Cronologia Vincite Cash
  const premiCalc: Record<string, number> = (() => {
    const out: Record<string, number> = {};
    Object.keys(premi).forEach((k) => {
      out[k] = 0;
    });
    winLog.forEach((w) => {
      out[w.key] = (out[w.key] ?? 0) + w.amount;
    });
    return out;
  })();
  const [inputVal, setInputVal] = useState("");
  const [target, setTarget] = useState<string>("MLS_Leaderboard");
  const [winDate, setWinDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [qPlayers, setQPlayers] = useState<string[]>(["", "", "", "", ""]);
  const [qCash, setQCash] = useState("");
  const [qEss, setQEss] = useState("");
  const [qEssRar, setQEssRar] = useState<Rarity>("LIMITED");
  const [sortBy, setSortBy] = useState<"cash" | "essences">("cash");

  // ALL STAR section
  const [aPlayers, setAPlayers] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [aEssOn, setAEssOn] = useState(false);
  const [aCashOn, setACashOn] = useState(false);
  const [aCardOn, setACardOn] = useState(false);
  const [aEssVal, setAEssVal] = useState("");
  const [aEssRar, setAEssRar] = useState<Rarity>("LIMITED");
  const [aCashVal, setACashVal] = useState("");
  const [aCard, setACard] = useState({
    name: "",
    season: "26/27",
    rarity: "LIMITED" as Rarity,
    role: "GK" as Role,
    serial: "",
    value: "",
    comp: "",
  });

  const handleUpdate = () => {
    if (!inputVal) return;
    const amount = parseFloat(inputVal);
    if (!Number.isFinite(amount)) return;
    if (!(target in premi)) setPremi({ ...premi, [target]: 0 });
    setWinLog([
      ...winLog,
      { key: target, amount, date: winDate || new Date().toISOString().slice(0, 10) },
    ]);
    setInputVal("");
  };

  // Cronologia vincite: modifica / eliminazione
  const [editWinIdx, setEditWinIdx] = useState<number | null>(null);
  const [editWinKey, setEditWinKey] = useState("");
  const [editWinAmount, setEditWinAmount] = useState("");
  const [editWinDate, setEditWinDate] = useState("");

  const startEditWin = (i: number) => {
    const w = winLog[i];
    if (!w) return;
    setEditWinIdx(i);
    setEditWinKey(w.key);
    setEditWinAmount(String(w.amount));
    setEditWinDate(w.date);
  };

  const saveEditWin = () => {
    if (editWinIdx == null) return;
    const old = winLog[editWinIdx];
    if (!old) return;
    const n = parseFloat(editWinAmount);
    const amount = Number.isFinite(n) ? n : 0;
    const log = [...winLog];
    log[editWinIdx] = { key: editWinKey, amount, date: editWinDate || old.date };
    setWinLog(log);
    setEditWinIdx(null);
  };

  const deleteWin = (i: number) => {
    const w = winLog[i];
    if (!w) return;
    if (!confirm(`Eliminare la vincita di $${w.amount.toFixed(2)} del ${w.date}?`)) return;
    setWinLog(winLog.filter((_, idx) => idx !== i));
    setEditWinIdx(null);
  };

  const handleRegister = () => {
    if (!qCash || !qEss) return;
    const cash = parseFloat(qCash) / 5;
    const ess = parseFloat(qEss) / 5;
    const updated = { ...roi };
    qPlayers.forEach((p) => {
      const key = p.trim();
      if (!key) return;
      const cur = updated[key] ?? { cash: 0, essences: 0, xp: 0 };
      updated[key] = {
        cash: cur.cash + cash,
        essences: cur.essences + ess,
        xp: cur.xp,
        essR: { ...(cur.essR ?? {}), [qEssRar]: ((cur.essR ?? {})[qEssRar] ?? 0) + ess },
      };
    });
    setRoi(updated);
    setQPlayers(["", "", "", "", ""]);
    setQCash("");
    setQEss("");
  };

  const handleRegisterAllStar = () => {
    const cashWon = aCashOn ? parseFloat(aCashVal) || 0 : 0;
    const essWon = aEssOn ? parseFloat(aEssVal) || 0 : 0;
    const cardWon = aCardOn ? parseFloat(aCard.value) || 0 : 0;
    const totalCash = cashWon + cardWon;
    if (totalCash === 0 && essWon === 0) return;
    if (aCardOn && aCard.comp && aCard.name.trim()) {
      const n = aCard.name.trim().toLowerCase();
      const s = aCard.season.trim().toLowerCase();
      const sr = (aCard.serial || "").trim().toLowerCase();
      const dup = cards.find(
        (c) =>
          c.name.trim().toLowerCase() === n &&
          c.season.trim().toLowerCase() === s &&
          (c.rarity || "") === aCard.rarity &&
          (c.serial || "").trim().toLowerCase() === sr,
      );
      if (dup) {
        alert(
          "Errore: esiste già una carta con nome, stagione, rarità e seriale identici nella tua galleria.",
        );
        return;
      }
    }
    const perCash = totalCash / 7;
    const perEss = essWon / 7;
    const updated = { ...roi };
    aPlayers.forEach((p) => {
      const key = p.trim();
      if (!key) return;
      const cur = updated[key] ?? { cash: 0, essences: 0, xp: 0 };
      updated[key] = {
        cash: cur.cash + perCash,
        essences: cur.essences + perEss,
        xp: cur.xp,
        essR: perEss
          ? { ...(cur.essR ?? {}), [aEssRar]: ((cur.essR ?? {})[aEssRar] ?? 0) + perEss }
          : cur.essR,
      };
    });

    setRoi(updated);
    // If a card was won and a competition selected, add it to the gallery with buy=0
    if (aCardOn && aCard.comp && aCard.name.trim()) {
      setCards([
        ...cards,
        {
          name: aCard.name.trim(),
          season: aCard.season,
          buy: 0,
          sell: null,
          comp: aCard.comp,
          serial: aCard.serial.trim() || undefined,
          rarity: aCard.rarity,
          role: aCard.role,
        },
      ]);
    }
    if (aCardOn && aCard.name.trim()) {
      setWonCards([
        ...wonCards,
        {
          name: aCard.name.trim(),
          season: aCard.season,
          rarity: aCard.rarity,
          role: aCard.role,
          serial: aCard.serial.trim() || undefined,
          value: parseFloat(aCard.value) || 0,
          date: new Date().toISOString().slice(0, 10),
        },
      ]);
    }
    setAPlayers(["", "", "", "", "", "", ""]);
    setAEssVal("");
    setACashVal("");
    setACard({
      name: "",
      season: "26/27",
      rarity: "LIMITED",
      role: "GK",
      serial: "",
      value: "",
      comp: "",
    });
    setAEssOn(false);
    setACashOn(false);
    setACardOn(false);
  };

  const sortedRoi = Object.entries(roi).sort((a, b) => b[1][sortBy] - a[1][sortBy]);

  const ownedCards = cards.filter((c) => c.sell == null);
  const optionsByRole: Record<Role, string[]> = { GK: [], DF: [], MD: [], FW: [] };
  ownedCards.forEach((c) => {
    if (c.role) optionsByRole[c.role].push(`${c.name} — ${c.season}`);
  });
  const extraOptions = [...optionsByRole.DF, ...optionsByRole.MD, ...optionsByRole.FW];
  const allOptions = [...optionsByRole.GK, ...extraOptions];
  const baseName = (v: string) => (v.split("—")[0] || "").trim().toLowerCase();
  const datalistOptions = (slot: Role | "EXTRA" | "ALL") =>
    slot === "EXTRA" ? extraOptions : slot === "ALL" ? allOptions : optionsByRole[slot];
  const serialForKey = (key: string): string | undefined => {
    const m = key.match(/^(.*)\s+—\s+(.+)$/);
    const name = (m ? m[1] : key).trim().toLowerCase();
    const season = m ? m[2].trim().toLowerCase() : "";
    const match = cards.find(
      (c) =>
        c.name.trim().toLowerCase() === name &&
        (!season || c.season.trim().toLowerCase() === season) &&
        c.serial,
    );
    return match?.serial;
  };
  const rarityForKey = (key: string): Rarity | undefined => {
    const m = key.match(/^(.*)\s+—\s+(.+)$/);
    const name = (m ? m[1] : key).trim().toLowerCase();
    const season = m ? m[2].trim().toLowerCase() : "";
    const match = cards.find(
      (c) =>
        c.name.trim().toLowerCase() === name &&
        (!season || c.season.trim().toLowerCase() === season),
    );
    return match?.rarity;
  };
  const pieColors = [
    "#f43f5e",
    "#f59e0b",
    "#22d3ee",
    "#a855f7",
    "#84cc16",
    "#ec4899",
    "#38bdf8",
    "#fb923c",
    "#4ade80",
    "#e879f9",
  ];
  const premiKeys = Object.keys(premi);
  const colorForKey = (k: string) => {
    const i = premiKeys.indexOf(k);
    return pieColors[(i < 0 ? 0 : i) % pieColors.length];
  };
  const pieData = Object.entries(premiCalc)
    .map(([k, v]) => ({ key: k, name: k.replace("_", " · "), value: v }))
    .filter((d) => d.value > 0);
  const premiTotal = pieData.reduce((s, d) => s + d.value, 0);

  // Istogramma mensile vincite cash (gen 2026 → dic 2027)
  const MONTH_LABELS = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  const histoKeys = Array.from(new Set([...premiKeys, ...winLog.map((w) => w.key)]));
  const histoData = (() => {
    const rows: Record<string, number | string>[] = [];
    for (let y = 2026; y <= 2027; y++) {
      for (let m = 0; m < 12; m++) {
        const row: Record<string, number | string> = {
          month: `${MONTH_LABELS[m]} ${String(y).slice(2)}`,
        };
        histoKeys.forEach((k) => {
          row[k] = 0;
        });
        rows.push(row);
      }
    }
    winLog.forEach((w) => {
      const d = new Date(w.date);
      const y = d.getFullYear();
      if (!Number.isFinite(y) || y < 2026 || y > 2027) return;
      const idx = (y - 2026) * 12 + d.getMonth();
      const row = rows[idx];
      if (!row) return;
      row[w.key] = ((row[w.key] as number) ?? 0) + w.amount;
    });
    return rows;
  })();
  const histoTotal = winLog.reduce((s, w) => s + w.amount, 0);

  const [editRoi, setEditRoi] = useState<string | null>(null);
  const [editRoiName, setEditRoiName] = useState("");
  const [editRoiCash, setEditRoiCash] = useState("");
  const [editRoiEssR, setEditRoiEssR] = useState<Record<Rarity, string>>({
    LIMITED: "0",
    RARE: "0",
    SR: "0",
    UNIQUE: "0",
  });
  const startEditRoi = (name: string) => {
    setEditRoi(name);
    setEditRoiName(name);
    const cur = roi[name];
    setEditRoiCash(cur ? String(cur.cash) : "0");
    setEditRoiEssR({
      LIMITED: String(cur?.essR?.LIMITED ?? 0),
      RARE: String(cur?.essR?.RARE ?? 0),
      SR: String(cur?.essR?.SR ?? 0),
      UNIQUE: String(cur?.essR?.UNIQUE ?? 0),
    });
  };
  const saveEditRoi = () => {
    if (!editRoi) return;
    const newName = editRoiName.trim() || editRoi;
    const newCash = parseFloat(editRoiCash);
    const cashVal = Number.isFinite(newCash) ? newCash : 0;
    const essR: Partial<Record<Rarity, number>> = {};
    let essVal = 0;
    RARITIES.forEach((r) => {
      const n = parseFloat(editRoiEssR[r]);
      const v = Number.isFinite(n) ? n : 0;
      if (v !== 0) essR[r] = v;
      essVal += v;
    });
    const next: typeof roi = {};
    for (const [k, v] of Object.entries(roi)) {
      if (k === editRoi) continue;
      next[k] = { ...v };
    }
    const existing = next[newName];
    const oldXp = roi[editRoi]?.xp ?? 0;
    if (existing && newName !== editRoi) {
      const merged: Partial<Record<Rarity, number>> = { ...(existing.essR ?? {}) };
      RARITIES.forEach((r) => {
        const add = essR[r] ?? 0;
        if (add) merged[r] = (merged[r] ?? 0) + add;
      });
      next[newName] = {
        cash: existing.cash + cashVal,
        essences: existing.essences + essVal,
        xp: existing.xp + oldXp,
        essR: merged,
      };
    } else {
      next[newName] = { cash: cashVal, essences: essVal, xp: oldXp, essR };
    }
    setRoi(next);
    setEditRoi(null);
  };

  const ToggleBtn = ({
    on,
    onClick,
    label,
  }: {
    on: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
        on
          ? "border-accent bg-accent/20 text-accent"
          : "border-border bg-background text-muted-foreground hover:bg-secondary"
      }`}
    >
      {on ? "🟢" : "⚫"} {label}
    </button>
  );

  return (
    <AppLayout title="Obiettivi & ROI Giocatori">
      <PageTitle>Obiettivi & ROI</PageTitle>

      <Card>
        <div className="mb-3">
          <SectionTitle>Aggiornamento Automatico Vincite</SectionTitle>
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-[1fr_260px] md:items-center">
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(premiCalc).map(([k, v]) => (
              <Row key={k}>
                <span className="text-muted-foreground truncate">{k.replace("_", " · ")}</span>
                <span className="font-semibold text-accent">${v.toFixed(2)}</span>
              </Row>
            ))}
          </div>
          <div className="h-56 rounded-xl border border-border bg-background/40 p-2">
            {premiTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nessun premio registrato — il grafico apparirà qui.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    stroke="#0f172a"
                    strokeWidth={2}
                    label={({ value, cx, cy, midAngle, outerRadius: r }) => {
                      const RAD = Math.PI / 180;
                      const rr = (r as number) + 14;
                      const x = (cx as number) + rr * Math.cos(-(midAngle as number) * RAD);
                      const y = (cy as number) + rr * Math.sin(-(midAngle as number) * RAD);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth={3}
                          paintOrder="stroke"
                          fontSize={12}
                          fontWeight={700}
                          textAnchor={x > (cx as number) ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {`$${Number(value).toFixed(2)}`}
                        </text>
                      );
                    }}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={colorForKey(d.key)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `$${v.toFixed(2)}`}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <Label>Valore da incrementare ($)</Label>
        <Input
          inputMode="decimal"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Es. 25"
        />

        <div className="mt-3">
          <Label>Data della vincita</Label>
          <Input type="date" value={winDate} onChange={(e) => setWinDate(e.target.value)} />
        </div>

        <div className="mt-3">
          <Label>Categoria</Label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(premi).map((k) => (
              <Tag key={k} active={target === k} onClick={() => setTarget(k)}>
                {k.replace("_", " · ")}
              </Tag>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleUpdate}>Conferma ed Incrementa</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>🕓 Cronologia Vincite Cash ({winLog.length})</SectionTitle>
        {winLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna vincita registrata.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 w-10"></th>
                  <th className="py-2">Data</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2 text-right">Importo</th>
                </tr>
              </thead>
              <tbody>
                {winLog
                  .map((w, i) => ({ w, i }))
                  .sort((a, b) => (a.w.date < b.w.date ? 1 : a.w.date > b.w.date ? -1 : b.i - a.i))
                  .map(({ w, i }) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          onClick={() => startEditWin(i)}
                          className="!px-2 !py-1 text-xs"
                        >
                          ⚙️
                        </Button>
                      </td>
                      <td className="py-2 whitespace-nowrap">{w.date}</td>
                      <td className="py-2">{w.key.replace("_", " · ")}</td>
                      <td className="py-2 text-right font-semibold text-accent">
                        ${w.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3">
          <SectionTitle>📊 Vincite Cash per Mese (2026 → 2027)</SectionTitle>
        </div>
        {histoTotal === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna vincita cash registrata — l'istogramma si aggiorna automaticamente quando
            incrementi una vincita.
          </p>
        ) : (
          <div className="h-72 w-full overflow-x-auto">
            <div className="h-full min-w-[720px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histoData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
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
                  <YAxis
                    tick={{ fontSize: 10, fill: "#e2e8f0" }}
                    axisLine={{ stroke: "#94a3b8" }}
                    tickLine={{ stroke: "#94a3b8" }}
                  />
                  <Tooltip
                    formatter={(v: number, n: string) => [
                      `$${Number(v).toFixed(2)}`,
                      String(n).replace("_", " · "),
                    ]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(v: string) => v.replace("_", " · ")}
                  />
                  {histoKeys.map((k) => (
                    <Bar key={k} dataKey={k} stackId="a" fill={colorForKey(k)} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>QUINTETTO VINCENTE</SectionTitle>
        <datalist id="gallery-players-ALL">
          {allOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <div className="grid gap-2 sm:grid-cols-2">
          {qPlayers.map((p, idx) => {
            const slot = QUINT_LABELS[idx];
            const taken = qPlayers
              .filter((_, i) => i !== idx)
              .map(baseName)
              .filter(Boolean);
            const opts = datalistOptions(slot).filter((o) => !taken.includes(baseName(o)));
            return (
              <div key={idx} className="relative">
                <datalist id={`q-slot-${idx}`}>
                  {opts.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  🔍
                </span>
                <Input
                  list={`q-slot-${idx}`}
                  placeholder={`${slot} — cerca in galleria`}
                  value={p}
                  onChange={(e) => {
                    const val = e.target.value;
                    const bn = baseName(val);
                    if (bn && qPlayers.some((o, i) => i !== idx && baseName(o) === bn)) {
                      alert(
                        "Questo giocatore è già presente nella formazione. Puoi usare una sola copia per giocatore.",
                      );
                      return;
                    }
                    const copy = [...qPlayers];
                    copy[idx] = val;
                    setQPlayers(copy);
                  }}
                  className="pl-8"
                />
              </div>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          <div>
            <Label>Soldi Vinti ($)</Label>
            <Input inputMode="decimal" value={qCash} onChange={(e) => setQCash(e.target.value)} />
          </div>
          <div>
            <Label>Essenze Vinte</Label>
            <div className="flex gap-2">
              <Input inputMode="decimal" value={qEss} onChange={(e) => setQEss(e.target.value)} />
              <select
                value={qEssRar}
                onChange={(e) => setQEssRar(e.target.value as Rarity)}
                className="w-32 rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
              >
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {RARITY_EMOJI[r]} {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="accent" onClick={handleRegister}>
            Calcola e Distribuisci ROI
          </Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>ALL STAR - U23 - CHAMPIONS</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {aPlayers.map((p, idx) => {
            const slot = ALLSTAR_LABELS[idx];
            const taken = aPlayers
              .filter((_, i) => i !== idx)
              .map(baseName)
              .filter(Boolean);
            const opts = datalistOptions(slot).filter((o) => !taken.includes(baseName(o)));
            return (
              <div key={idx} className="relative">
                <datalist id={`a-slot-${idx}`}>
                  {opts.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  🔍
                </span>
                <Input
                  list={`a-slot-${idx}`}
                  placeholder={`${slot} — cerca in galleria`}
                  value={p}
                  onChange={(e) => {
                    const val = e.target.value;
                    const bn = baseName(val);
                    if (bn && aPlayers.some((o, i) => i !== idx && baseName(o) === bn)) {
                      alert(
                        "Questo giocatore è già presente nella formazione. Puoi usare una sola copia per giocatore.",
                      );
                      return;
                    }
                    const copy = [...aPlayers];
                    copy[idx] = val;
                    setAPlayers(copy);
                  }}
                  className="pl-8"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Label>Premi</Label>
          <div className="flex flex-wrap gap-2">
            <ToggleBtn on={aEssOn} onClick={() => setAEssOn(!aEssOn)} label="Essenze Vinte" />
            <ToggleBtn on={aCashOn} onClick={() => setACashOn(!aCashOn)} label="Soldi Vinti" />
            <ToggleBtn on={aCardOn} onClick={() => setACardOn(!aCardOn)} label="Carta Vinta" />
          </div>
        </div>

        {aEssOn && (
          <div className="mt-3">
            <Label>Essenze Vinte</Label>
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={aEssVal}
                onChange={(e) => setAEssVal(e.target.value)}
              />
              <select
                value={aEssRar}
                onChange={(e) => setAEssRar(e.target.value as Rarity)}
                className="w-32 rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
              >
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {RARITY_EMOJI[r]} {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {aCashOn && (
          <div className="mt-3">
            <Label>Soldi Vinti ($)</Label>
            <Input
              inputMode="decimal"
              value={aCashVal}
              onChange={(e) => setACashVal(e.target.value)}
            />
          </div>
        )}
        {aCardOn && (
          <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
            <p className="mb-2 text-xs font-semibold text-accent">Carta Vinta</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={aCard.name}
                  onChange={(e) => setACard({ ...aCard, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Stagione</Label>
                <select
                  value={aCard.season}
                  onChange={(e) => setACard({ ...aCard, season: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Rarità</Label>
                <select
                  value={aCard.rarity}
                  onChange={(e) => setACard({ ...aCard, rarity: e.target.value as Rarity })}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
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
                  value={aCard.role}
                  onChange={(e) => setACard({ ...aCard, role: e.target.value as Role })}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Seriale</Label>
                <Input
                  value={aCard.serial}
                  onChange={(e) => setACard({ ...aCard, serial: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Valore ($)</Label>
                <Input
                  inputMode="decimal"
                  value={aCard.value}
                  onChange={(e) => setACard({ ...aCard, value: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Competizione (dove aggiungere la carta)</Label>
                <select
                  value={aCard.comp}
                  onChange={(e) => setACard({ ...aCard, comp: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                >
                  <option value="">— Seleziona competizione —</option>
                  {competitions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {!aCard.comp && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Se non selezioni una competizione, la carta non verrà aggiunta alla galleria.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button variant="accent" onClick={handleRegisterAllStar}>
            Calcola e Distribuisci ROI (/7)
          </Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>💎 Essenze Totali Vinte per Rarità</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RARITIES.map((rar) => {
            const tot = Object.values(roi).reduce((s, r) => s + (r.essR?.[rar] ?? 0), 0);
            return (
              <div key={rar} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">
                  ESSENZE TOTALI VINTE {RARITY_EMOJI[rar]}
                </div>
                <div className="mt-1 text-xl font-bold text-accent">{tot.toFixed(2)}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {rar}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>🏆 Classifica ROI Giocatori</SectionTitle>
          <div className="flex items-center gap-2">
            <Label>Ordina per</Label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "cash" | "essences")}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="cash">$ (Soldi)</option>
              <option value="essences">Essenze</option>
            </select>
          </div>
        </div>
        {sortedRoi.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun quintetto registrato.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead className="bg-secondary/60 text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-6 px-1 py-2 text-left font-semibold">#</th>
                  <th className="w-16 px-1 py-2 text-right font-semibold">$</th>
                  <th className="w-20 px-1 py-2 text-right font-semibold">Ess.</th>
                  <th className="w-10 px-1 py-2 text-right font-semibold">⚙️</th>
                  <th className="min-w-0 px-1 py-2 text-left font-semibold">Giocatore</th>
                </tr>
              </thead>
              <tbody>
                {sortedRoi.map(([player, r], i) => (
                  <tr key={player} className="border-t border-border">
                    <td className="px-1 py-2 text-muted-foreground">{i + 1}</td>
                    <td
                      className={`px-1 py-2 text-right font-semibold ${sortBy === "cash" ? "text-accent" : ""}`}
                    >
                      ${r.cash.toFixed(2)}
                    </td>
                    <td
                      className={`px-1 py-2 text-right ${sortBy === "essences" ? "text-accent font-semibold" : ""}`}
                    >
                      <div>{r.essences.toFixed(2)}</div>
                      {r.essR && (
                        <div className="text-[10px] leading-tight text-muted-foreground">
                          {RARITIES.filter((rar) => (r.essR?.[rar] ?? 0) > 0).map((rar) => (
                            <div key={rar}>
                              {RARITY_EMOJI[rar]} {(r.essR?.[rar] ?? 0).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-1 py-2 text-right">
                      <button
                        onClick={() => startEditRoi(player)}
                        className="rounded-md border border-border px-1.5 py-1 text-xs hover:bg-secondary"
                      >
                        ✏️
                      </button>
                    </td>
                    <td className="min-w-0 break-words px-1 py-2 font-medium">
                      {rarityForKey(player) && (
                        <span className="mr-1" title={rarityForKey(player)}>
                          {RARITY_EMOJI[rarityForKey(player)!]}
                        </span>
                      )}
                      {player}
                      {serialForKey(player) && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          #{serialForKey(player)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editWinIdx != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditWinIdx(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-bold">Modifica Vincita</h3>
            <Label>Categoria</Label>
            <select
              value={editWinKey}
              onChange={(e) => setEditWinKey(e.target.value)}
              className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {Array.from(new Set([...Object.keys(premi), editWinKey])).map((k) => (
                <option key={k} value={k}>
                  {k.replace("_", " · ")}
                </option>
              ))}
            </select>
            <Label>Importo ($)</Label>
            <Input
              inputMode="decimal"
              value={editWinAmount}
              onChange={(e) => setEditWinAmount(e.target.value)}
            />
            <div className="mt-3">
              <Label>Data</Label>
              <Input
                type="date"
                value={editWinDate}
                onChange={(e) => setEditWinDate(e.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => deleteWin(editWinIdx)}
                className="text-red-400 hover:text-red-300"
              >
                🗑️ Elimina
              </Button>
              <Button variant="ghost" onClick={() => setEditWinIdx(null)}>
                Annulla
              </Button>
              <Button variant="accent" onClick={saveEditWin}>
                Salva
              </Button>
            </div>
          </div>
        </div>
      )}

      {editRoi != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditRoi(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-bold">Modifica Giocatore ROI</h3>
            <Label>Nome</Label>
            <Input
              list="gallery-players-ALL"
              value={editRoiName}
              onChange={(e) => setEditRoiName(e.target.value)}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label>$ Soldi</Label>
                <Input
                  inputMode="decimal"
                  value={editRoiCash}
                  onChange={(e) => setEditRoiCash(e.target.value)}
                />
              </div>
              <div>
                <Label>Essenze totali</Label>
                <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  {RARITIES.reduce((s2, r) => s2 + (parseFloat(editRoiEssR[r]) || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Label>Essenze per rarità</Label>
              <div className="grid grid-cols-2 gap-3">
                {RARITIES.map((r) => (
                  <div key={r}>
                    <span className="mb-1 block text-[11px] text-muted-foreground">
                      {RARITY_EMOJI[r]} {r}
                    </span>
                    <Input
                      inputMode="decimal"
                      value={editRoiEssR[r]}
                      onChange={(e) => setEditRoiEssR({ ...editRoiEssR, [r]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Se il nuovo nome esiste già in classifica, i valori verranno sommati.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  if (!editRoi) return;
                  if (!confirm(`Rimuovere "${editRoi}" dalla classifica ROI?`)) return;
                  const next = { ...roi };
                  delete next[editRoi];
                  setRoi(next);
                  setEditRoi(null);
                }}
                className="text-red-400 hover:text-red-300"
              >
                🗑️ Rimuovi
              </Button>
              <Button variant="ghost" onClick={() => setEditRoi(null)}>
                Annulla
              </Button>
              <Button variant="accent" onClick={saveEditRoi}>
                Salva
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
