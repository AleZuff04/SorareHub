import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button, Card, Input, Label, PageTitle } from "@/components/ui-kit";
import { type Rarity, type Role } from "@/lib/sorare-store";
import { useGalleriaForm } from "@/hooks/useGalleriaForm";

// 1. Costanti statiche messe IN ALTO per evitare errori di sintassi
const RARITIES: Rarity[] = ["LIMITED", "RARE", "SR", "UNIQUE"];
const ROLES: Role[] = ["GK", "DF", "MD", "FW"];
const SEASONS: string[] = [
  "2026/2027",
  "2025/2026",
  "2024/2025",
  "2023/2024",
  "2022/2023",
];

// 2. Registrazione della rotta TanStack
export const Route = createFileRoute("/")({
  component: IndexPage,
});

// 3. Componente della pagina
function IndexPage() {
  const { state, actions } = useGalleriaForm();

  return (
    <AppLayout>
      <PageTitle>Galleria Carte</PageTitle>

      <Card className="p-4 my-4">
        <form onSubmit={actions.handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="search">Cerca Giocatore</Label>
            <Input
              id="search"
              value={state.search}
              onChange={(e) => actions.setSearch(e.target.value)}
              placeholder="Nome del giocatore..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Rarità</Label>
              <select
                value={state.rarity}
                onChange={(e) => actions.setRarity(e.target.value as Rarity)}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
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
                value={state.role}
                onChange={(e) => actions.setRole(e.target.value as Role)}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Stagione</Label>
              <select
                value={state.season}
                onChange={(e) => actions.setSeason(e.target.value)}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={actions.handleReset}>
              Reset
            </Button>
            <Button type="submit">Filtra</Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}
