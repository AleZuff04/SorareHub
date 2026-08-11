import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

export type Rarity = "LIMITED" | "RARE" | "SR" | "UNIQUE";
export type Role = "GK" | "DF" | "MD" | "FW";

export type Card = {
  name: string;
  season: string;
  buy: number;
  sell: number | null;
  comp: string;
  serial?: string;
  rarity?: Rarity;
  role?: Role;
};

export type ArenaSession = { spent: number; won: number; xp: number };
export type RoiEntry = {
  cash: number;
  essences: number;
  xp: number;
  essR?: Partial<Record<Rarity, number>>;
};
export type WinLogEntry = { key: string; amount: number; date: string };

export type Payload = {
  cards: Card[];
  competitions: string[];
  sessions: ArenaSession[];
  sessionsRare: ArenaSession[];
  sessionsSr: ArenaSession[];
  premi: Record<string, number>;
  roi: Record<string, RoiEntry>;
  winLog: WinLogEntry[];
};

const EMPTY: Payload = {
  cards: [],
  competitions: [],
  sessions: [],
  sessionsRare: [],
  sessionsSr: [],
  premi: {},
  roi: {},
  winLog: [],
};

export async function loadPayload(ctx: ToolContext): Promise<Payload> {
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", ctx.getUserId()!)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const p = (data?.data ?? {}) as Partial<Payload>;
  return { ...EMPTY, ...p };
}

export async function savePayload(ctx: ToolContext, payload: Payload): Promise<void> {
  const supabase = supabaseForUser(ctx);
  const { error } = await supabase.from("user_data").upsert({
    user_id: ctx.getUserId()!,
    data: payload as never,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export const isSold = (c: Card) => typeof c.sell === "number" && c.sell > 0;
export const money = (n: number) => Number(n.toFixed(2));
