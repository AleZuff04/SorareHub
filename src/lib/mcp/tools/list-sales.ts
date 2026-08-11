import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isSold, loadPayload, money } from "../data";

export default defineTool({
  name: "list_sales",
  title: "Plusvalenze",
  description: "Elenca le carte vendute con la plusvalenza per carta e il totale complessivo.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const { cards } = await loadPayload(ctx);
    const sold = cards.filter(isSold);
    const rows = sold.map((c) => ({
      name: c.name,
      season: c.season,
      serial: c.serial ?? "",
      rarity: c.rarity ?? null,
      buy: money(c.buy),
      sell: money(c.sell as number),
      profit: money((c.sell as number) - c.buy),
    }));
    const total = money(rows.reduce((s, r) => s + r.profit, 0));
    const limited = rows.slice(0, input.limit ?? 100);
    return {
      content: [
        { type: "text", text: JSON.stringify({ totalProfit: total, sales: limited }, null, 2) },
      ],
      structuredContent: { totalProfit: total, count: rows.length, sales: limited },
    };
  },
});
