import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageTitle, SectionTitle } from "@/components/ui-kit";
import { useSorare } from "@/lib/sorare-store";

export const Route = createFileRoute("/plusvalenze")({
  component: PlusvalenzePage,
});

function PlusvalenzePage() {
  const { cards } = useSorare();


  const sold = cards
    .map((c) => ({ ...c, sell: c.sell }))
    .filter((c): c is typeof c & { sell: number } => c.sell != null && c.sell !== 0);

  const rows = sold.map((c) => ({ name: c.name, season: c.season, serial: c.serial, pl: c.sell - c.buy }));
  const total = rows.reduce((s, r) => s + r.pl, 0);
  const totalTone = total > 0 ? "text-accent" : total < 0 ? "text-destructive" : "text-foreground";


  return (
    <AppLayout title="Plusvalenze">
      <PageTitle
        badge={
          <span className={`rounded-full bg-secondary px-3 py-1 text-xs font-semibold ${totalTone}`}>
            Totale: {total >= 0 ? "+" : ""}
            {total.toFixed(2)}€
          </span>
        }
      >
        Plusvalenze
      </PageTitle>

      <Card>
        <SectionTitle>Giocatori Venduti</SectionTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessun giocatore venduto. Imposta un prezzo di vendita da “Modifica” in Galleria per vederlo qui.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Giocatore</th>
                  <th className="px-3 py-2 text-left font-semibold">Stagione</th>
                  <th className="px-3 py-2 text-left font-semibold">Seriale</th>
                  <th className="px-3 py-2 text-right font-semibold">Plusvalenza</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const tone = r.pl > 0 ? "text-accent" : r.pl < 0 ? "text-destructive" : "text-foreground";
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.season}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.serial ? `#${r.serial}` : "—"}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${tone}`}>
                        {r.pl >= 0 ? "+" : ""}
                        {r.pl.toFixed(2)}€
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border bg-secondary/30">
                  <td className="px-3 py-2 font-semibold" colSpan={3}>Totale</td>
                  <td className={`px-3 py-2 text-right font-bold ${totalTone}`}>
                    {total >= 0 ? "+" : ""}
                    {total.toFixed(2)}€
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </AppLayout>
  );
}
