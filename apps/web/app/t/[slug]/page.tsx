import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { serverApiFetch } from "@/lib/api";

type Topic = { id: string; name: string; slug: string };
type Item = {
  id: string;
  claim_summary: string;
  evidence_quote: string;
  source_url: string;
  politician: { name: string };
};

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topics = await serverApiFetch<{ items: Topic[] }>("topics");
  const topic = topics.items.find((t) => t.slug === params.slug);
  const data = topic ? await serverApiFetch<{ items: Item[] }>(`timeline?topic_id=${topic.id}`) : { items: [] };

  return (
    <AppShell>
      <Card>
        <CardTitle>Seneste statements: {topic?.name || params.slug}</CardTitle>
        <div className="mt-4 space-y-3">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">{item.claim_summary}</p>
              <p className="mt-1 text-xs text-foreground/60">{item.politician.name}</p>
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
