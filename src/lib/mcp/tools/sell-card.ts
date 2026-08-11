import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadPayload, savePayload, money } from "../data";

export default defineTool({
  name: "sell_card",
  title: "Registra vendita",
  description: "Registra il prezzo di vendita di una carta: la carta passa nella sezione Plusvalenze.",
  inputSchema: {
    name: z.string().trim().min(1),
    season: z.string().trim().min(1),
    serial: z.string().trim().optional().describe("Utile per distinguere copie identiche."),
    sell: z.number().min(0).describe("Prezzo di vendita in €."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const payload = await loadPayload(ctx);
    const matches = payload.cards
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) =>
          c.name.trim().toLowerCase() === input.name.toLowerCase() &&
          c.season === input.season &&
          (input.serial ? (c.serial ?? "") === input.serial : true) &&
          !(typeof c.sell === "number" && c.sell > 0),
      );
    if (matches.length === 0) throw new ToolError("Nessuna carta corrispondente trovata in galleria.");
    if (matches.length > 1)
      throw new ToolError("Più carte corrispondono: specifica il seriale per identificarne una sola.");

    const { c, i } = matches[0]!;
    const updated = { ...c, sell: money(input.sell) };
    payload.cards = payload.cards.map((x, idx) => (idx === i ? updated : x));
    await savePayload(ctx, payload);
    const profit = money(updated.sell! - updated.buy);
    return {
      content: [{ type: "text", text: `Venduta ${updated.name} ${updated.season} a €${updated.sell!.toFixed(2)} — plusvalenza €${profit.toFixed(2)}` }],
      structuredContent: { card: updated, profit },
    };
  },
});
