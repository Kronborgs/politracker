import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { serverApiFetch } from "@/lib/api";

type Item = {
  id: string;
  claim_summary: string;
  evidence_quote: string;
  source_url: string;
  topic: { name: string };
};

export default async function PoliticianPage({ params }: { params: { id: string } }) {
  const data = await serverApiFetch<{ items: Item[] }>(`timeline?politician_id=${params.id}`);

  return (
    <AppShell>
      <Card>
        <CardTitle>Tidslinje for politiker</CardTitle>
        <div className="mt-4 space-y-3">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">{item.claim_summary}</p>
              <p className="mt-1 text-xs text-foreground/60">{item.topic.name}</p>
              <p className="mt-2 text-sm text-foreground/80">“{item.evidence_quote}”</p>
              <a className="mt-2 block text-xs text-primary" href={item.source_url} target="_blank">
                Se kilde
              </a>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
