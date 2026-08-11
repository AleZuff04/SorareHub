import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadPayload, money } from "../data";

export default defineTool({
  name: "roi_leaderboard",
  title: "Classifica ROI",
  description: "Classifica dei giocatori per ROI, ordinabile per soldi vinti o essenze vinte.",
  inputSchema: {
    sortBy: z.enum(["cash", "essences"]).optional().describe("Default: cash"),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const { roi } = await loadPayload(ctx);
    const sortBy = input.sortBy ?? "cash";
    const rows = Object.entries(roi)
      .map(([key, v]) => ({
        player: key,
        cash: money(v.cash ?? 0),
        essences: Math.round(v.essences ?? 0),
        essencesByRarity: v.essR ?? {},
      }))
      .sort((a, b) => (sortBy === "cash" ? b.cash - a.cash : b.essences - a.essences))
      .slice(0, input.limit ?? 25);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { sortBy, rows },
    };
  },
});
