import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Rarity = "LIMITED" | "RARE" | "SR" | "UNIQUE";
export type Role = "GK" | "DF" | "MD" | "FW";
export type SwapDetail = {
  cash: number;
  cashReceived?: number;
  players: { name: string; season: string; serial: string; value: number; rarity?: Rarity; role?: Role }[];
};
export type Card = {
  name: string;
  season: string;
  buy: number;
  sell: number | null;
  comp: string;
  serial?: string;
  rarity?: Rarity;
  role?: Role;
  swap?: SwapDetail;
};
export type ArenaSession = { spent: number; won: number; xp: number };
export type PremiKey = "MLS_Streak" | "MLS_Leaderboard" | "Eredivisie_Streak" | "Eredivisie_Leaderboard";
export type PremiMap = Record<string, number>;
export type RoiEntry = { cash: number; essences: number; xp: number; essR?: Partial<Record<Rarity, number>> };
export type RoiTable = Record<string, RoiEntry>;
export type WinLogEntry = { key: string; amount: number; date: string };
export type RicaricaEntry = { amount: number; date: string; note?: string };
export type WonCard = {
  name: string;
  season: string;
  rarity?: Rarity;
  role?: Role;
  serial?: string;
  value: number;
  date: string;
};

export type CraftEntry = {
  date: string;
  name: string;
  season: string;
  rarity?: Rarity;
  role?: Role;
  serial?: string;
  value: number;
  essRarity: Rarity;
  essQty: number;
  comp: string;
};
export type IndizioType = "Best Five" | "Livello più alto" | "Competizione" | "Paese";
export type WheelSpin = {
  date: string;
  essences?: { rarity?: Rarity; qty: number };
  xp?: number;
  credits?: number;
  star?: { name: string; season: string; rarity?: Rarity; role?: Role; serial?: string; value: number; comp: string };
  indizi?: { type: IndizioType; qty: number };
};

type Store = {
  cards: Card[];
  setCards: (c: Card[]) => void;
  competitions: string[];
  setCompetitions: (c: string[]) => void;
  sessions: ArenaSession[];
  setSessions: (s: ArenaSession[]) => void;
  sessionsRare: ArenaSession[];
  setSessionsRare: (s: ArenaSession[]) => void;
  sessionsSr: ArenaSession[];
  setSessionsSr: (s: ArenaSession[]) => void;
  premi: PremiMap;
  setPremi: (p: PremiMap) => void;
  roi: RoiTable;
  setRoi: (r: RoiTable) => void;
  winLog: WinLogEntry[];
  setWinLog: (w: WinLogEntry[]) => void;
  ricariche: RicaricaEntry[];
  setRicariche: (r: RicaricaEntry[]) => void;
  wonCards: WonCard[];
  setWonCards: (w: WonCard[]) => void;
  crafts: CraftEntry[];
  setCrafts: (c: CraftEntry[]) => void;
  wheelSpins: WheelSpin[];
  setWheelSpins: (w: WheelSpin[]) => void;
  session: Session | null;
  authReady: boolean;
  dataReady: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

const defaultCards: Card[] = [];
const defaultComps = ["MLS", "Eredivisie"];
const defaultPremi: PremiMap = {
  MLS_Streak: 0,
  MLS_Leaderboard: 0,
  Eredivisie_Streak: 0,
  Eredivisie_Leaderboard: 0,
};

type Payload = {
  cards: Card[];
  competitions: string[];
  sessions: ArenaSession[];
  sessionsRare: ArenaSession[];
  sessionsSr: ArenaSession[];
  premi: PremiMap;
  roi: RoiTable;
  winLog: WinLogEntry[];
  ricariche: RicaricaEntry[];
  wonCards: WonCard[];
  crafts: CraftEntry[];
  wheelSpins: WheelSpin[];
};

export function SorareProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[]>(defaultCards);
  const [competitions, setCompetitions] = useState<string[]>(defaultComps);
  const [sessions, setSessions] = useState<ArenaSession[]>([]);
  const [sessionsRare, setSessionsRare] = useState<ArenaSession[]>([]);
  const [sessionsSr, setSessionsSr] = useState<ArenaSession[]>([]);
  const [premi, setPremi] = useState<PremiMap>(defaultPremi);
  const [roi, setRoi] = useState<RoiTable>({});
  const [winLog, setWinLog] = useState<WinLogEntry[]>([]);
  const [ricariche, setRicariche] = useState<RicaricaEntry[]>([]);
  const [wonCards, setWonCards] = useState<WonCard[]>([]);
  const [crafts, setCrafts] = useState<CraftEntry[]>([]);
  const [wheelSpins, setWheelSpins] = useState<WheelSpin[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const skipSaveRef = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth listener
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load user data on session change
  useEffect(() => {
    if (!authReady) return;
    if (!session) {
      skipSaveRef.current = true;
      setCards(defaultCards);
      setCompetitions(defaultComps);
      setSessions([]);
      setSessionsRare([]);
      setSessionsSr([]);
      setPremi(defaultPremi);
      setRoi({});
      setWinLog([]);
      setRicariche([]);
      setWonCards([]);
      setCrafts([]);
      setWheelSpins([]);
      setDataReady(false);
      return;
    }
    let cancelled = false;
    skipSaveRef.current = true;
    setDataReady(false);
    (async () => {
      const { data, error } = await supabase
        .from("user_data")
        .select("data")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Load user_data failed", error);
      }
      const p = (data?.data as Partial<Payload> | null) ?? null;
      setCards(p?.cards ?? defaultCards);
      setCompetitions(p?.competitions ?? defaultComps);
      setSessions(p?.sessions ?? []);
      setSessionsRare(p?.sessionsRare ?? []);
      setSessionsSr(p?.sessionsSr ?? []);
      setPremi(p?.premi ?? defaultPremi);
      setRoi(p?.roi ?? {});
      setWinLog(p?.winLog ?? []);
      setRicariche(p?.ricariche ?? []);
      setWonCards(p?.wonCards ?? []);
      setCrafts(p?.crafts ?? []);
      setWheelSpins(p?.wheelSpins ?? []);
      setDataReady(true);
      // release skip after state settles
      setTimeout(() => { skipSaveRef.current = false; }, 50);
    })();
    return () => { cancelled = true; };
  }, [session, authReady]);

  // Debounced save to Supabase
  useEffect(() => {
    if (!session || !dataReady || skipSaveRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload: Payload = { cards, competitions, sessions, sessionsRare, sessionsSr, premi, roi, winLog, ricariche, wonCards, crafts, wheelSpins };
      const { error } = await supabase
        .from("user_data")
        .upsert({ user_id: session.user.id, data: payload as never, updated_at: new Date().toISOString() });
      if (error) console.error("Save user_data failed", error);
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [cards, competitions, sessions, sessionsRare, sessionsSr, premi, roi, winLog, ricariche, wonCards, crafts, wheelSpins, session, dataReady]);

  // Keep premi in sync with competitions
  useEffect(() => {
    if (!dataReady) return;
    const next: PremiMap = {};
    let changed = false;
    for (const comp of competitions) {
      for (const suffix of ["Streak", "Leaderboard"] as const) {
        const key = `${comp}_${suffix}`;
        next[key] = premi[key] ?? 0;
        if (!(key in premi)) changed = true;
      }
    }
    for (const k of Object.keys(premi)) {
      if (!(k in next)) changed = true;
    }
    if (changed) setPremi(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitions, dataReady]);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider
      value={{
        cards, setCards, competitions, setCompetitions, sessions, setSessions,
        sessionsRare, setSessionsRare, sessionsSr, setSessionsSr,
        premi, setPremi, roi, setRoi, winLog, setWinLog,
        ricariche, setRicariche, wonCards, setWonCards,
        crafts, setCrafts, wheelSpins, setWheelSpins,
        session, authReady, dataReady, signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSorare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSorare must be used within SorareProvider");
  return ctx;
}

export function exportBackup(data: Payload) {
  const payload = { version: 2, exportedAt: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sorare-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importBackupFile(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  return {
    cards: (parsed.cards ?? []) as Card[],
    competitions: (parsed.competitions ?? []) as string[],
    sessions: (parsed.sessions ?? []) as ArenaSession[],
    sessionsRare: (parsed.sessionsRare ?? []) as ArenaSession[],
    sessionsSr: (parsed.sessionsSr ?? []) as ArenaSession[],
    premi: (parsed.premi ?? {}) as PremiMap,
    roi: (parsed.roi ?? {}) as RoiTable,
    winLog: (parsed.winLog ?? []) as WinLogEntry[],
    ricariche: (parsed.ricariche ?? []) as RicaricaEntry[],
    wonCards: (parsed.wonCards ?? []) as WonCard[],
    crafts: (parsed.crafts ?? []) as CraftEntry[],
    wheelSpins: (parsed.wheelSpins ?? []) as WheelSpin[],
  };
}
