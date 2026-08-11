import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isSold, loadPayload, money } from "../data";

export default defineTool({
  name: "list_cards",
  title: "Elenca carte",
  description:
    "Elenca le carte in galleria dell'utente, con filtri opzionali per nome, rarità, stagione, ruolo e competizione.",
  inputSchema: {
    query: z.string().trim().optional().describe("Testo cercato in nome o seriale."),
    rarity: z.enum(["LIMITED", "RARE", "SR", "UNIQUE"]).optional(),
    season: z.string().trim().optional().describe("Es. 25/26"),
    role: z.enum(["GK", "DF", "MD", "FW"]).optional(),
    competition: z.string().trim().optional(),
    includeSold: z
      .boolean()
      .optional()
      .describe("Includi anche le carte già vendute (default false)."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const { cards } = await loadPayload(ctx);
    const q = input.query?.toLowerCase();
    const rows = cards
      .filter((c) => (input.includeSold ? true : !isSold(c)))
      .filter((c) => (input.rarity ? c.rarity === input.rarity : true))
      .filter((c) => (input.season ? c.season === input.season : true))
      .filter((c) => (input.role ? c.role === input.role : true))
      .filter((c) => (input.competition ? c.comp === input.competition : true))
      .filter((c) =>
        q ? c.name.toLowerCase().includes(q) || (c.serial ?? "").toLowerCase().includes(q) : true,
      )
      .slice(0, input.limit ?? 50)
      .map((c) => ({ ...c, buy: money(c.buy), sell: c.sell == null ? null : money(c.sell) }));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, cards: rows },
    };
  },
});
