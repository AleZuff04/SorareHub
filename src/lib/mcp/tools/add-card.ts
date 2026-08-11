import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadPayload, savePayload, money, type Card } from "../data";

export default defineTool({
  name: "add_card",
  title: "Aggiungi carta",
  description:
    "Aggiunge una nuova carta alla galleria dell'utente (blocca i duplicati esatti: nome, stagione, rarità, seriale).",
  inputSchema: {
    name: z.string().trim().min(1),
    season: z.string().trim().min(1).describe("Es. 25/26"),
    competition: z.string().trim().min(1).describe("Deve essere una competizione già esistente."),
    buy: z.number().min(0).describe("Prezzo di acquisto in €."),
    rarity: z.enum(["LIMITED", "RARE", "SR", "UNIQUE"]).optional(),
    role: z.enum(["GK", "DF", "MD", "FW"]).optional(),
    serial: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const payload = await loadPayload(ctx);
    if (!payload.competitions.includes(input.competition)) {
      throw new ToolError(
        `Competizione sconosciuta: ${input.competition}. Disponibili: ${payload.competitions.join(", ") || "nessuna"}`,
      );
    }
    const dup = payload.cards.some(
      (c) =>
        c.name.trim().toLowerCase() === input.name.toLowerCase() &&
        c.season === input.season &&
        (c.rarity ?? "") === (input.rarity ?? "") &&
        (c.serial ?? "") === (input.serial ?? ""),
    );
    if (dup)
      throw new ToolError(
        "Carta già presente in galleria (nome, stagione, rarità e seriale identici).",
      );

    const card: Card = {
      name: input.name,
      season: input.season,
      comp: input.competition,
      buy: money(input.buy),
      sell: null,
      ...(input.rarity ? { rarity: input.rarity } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.serial ? { serial: input.serial } : {}),
    };
    payload.cards = [...payload.cards, card];
    await savePayload(ctx, payload);
    return {
      content: [
        { type: "text", text: `Carta aggiunta: ${card.name} ${card.season} (${card.comp})` },
      ],
      structuredContent: { card },
    };
  },
});
