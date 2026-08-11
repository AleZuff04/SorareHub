import { defineTool } from "@lovable.dev/mcp-js";
import { isSold, loadPayload, money, type ArenaSession } from "../data";

function arenaStats(sessions: ArenaSession[]) {
  const spent = sessions.reduce((s, x) => s + (x.spent ?? 0), 0);
  const won = sessions.reduce((s, x) => s + (x.won ?? 0), 0);
  const xp = sessions.reduce((s, x) => s + (x.xp ?? 0), 0);
  return {
    sessions: sessions.length,
    spent: Math.round(spent),
    won: Math.round(won),
    net: Math.round(won - spent),
    xp: Math.round(xp),
    costPerXp: xp > 0 ? money((spent - won) / xp) : null,
  };
}

export default defineTool({
  name: "get_overview",
  title: "Panoramica account",
  description: "Riepilogo dell'account: carte in galleria, spesa totale, plusvalenze, vincite per competizione e statistiche arene.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const p = await loadPayload(ctx);
    const owned = p.cards.filter((c) => !isSold(c));
    const sold = p.cards.filter(isSold);
    const summary = {
      competitions: p.competitions,
      ownedCards: owned.length,
      soldCards: sold.length,
      totalSpentOnOwned: money(owned.reduce((s, c) => s + (c.buy ?? 0), 0)),
      totalProfit: money(sold.reduce((s, c) => s + ((c.sell as number) - c.buy), 0)),
      prizesByKey: Object.fromEntries(Object.entries(p.premi ?? {}).map(([k, v]) => [k, money(v ?? 0)])),
      arenas: {
        limited: arenaStats(p.sessions ?? []),
        rare: arenaStats(p.sessionsRare ?? []),
        sr: arenaStats(p.sessionsSr ?? []),
      },
      trackedRoiPlayers: Object.keys(p.roi ?? {}).length,
      cashWinsLogged: (p.winLog ?? []).length,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
