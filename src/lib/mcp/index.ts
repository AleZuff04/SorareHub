import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getOverview from "./tools/get-overview";
import listCards from "./tools/list-cards";
import listSales from "./tools/list-sales";
import roiLeaderboard from "./tools/roi-leaderboard";
import addCard from "./tools/add-card";
import sellCard from "./tools/sell-card";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "sorarehub",
  title: "SorareHub",
  version: "0.1.0",
  instructions:
    "Strumenti per il gestionale SorareHub dell'utente autenticato: galleria carte, plusvalenze, classifica ROI e arene. Usa get_overview per un riepilogo, list_cards per cercare carte, list_sales per le plusvalenze, roi_leaderboard per la classifica, add_card e sell_card per aggiornare la galleria.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getOverview, listCards, listSales, roiLeaderboard, addCard, sellCard],
});
