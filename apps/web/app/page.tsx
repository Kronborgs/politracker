import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { serverApiFetch } from "@/lib/api";
import { MotionDiv } from "./ui-motion";

type TimelineItem = {
  id: string;
  claim_summary: string;
  evidence_quote: string;
  source_url: string;
  created_at: string;
  politician: { name: string };
  topic: { name: string; slug: string };
};

export default async function HomePage() {
  const [timeline, politicians, topics] = await Promise.all([
    serverApiFetch<{ items: TimelineItem[] }>("timeline"),
    serverApiFetch<{ items: Array<{ id: string; name: string; party?: string }> }>("politicians"),
    serverApiFetch<{ items: Array<{ id: string; name: string; slug: string }> }>("topics")
  ]);

  return (
    <AppShell>
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardTitle>Seneste ændringer</CardTitle>
          <CardDescription>AI-udledte udsagn med evidens og links til kilder.</CardDescription>
          <div className="mt-4 space-y-3">
            {timeline.items.slice(0, 8).map((item, idx) => (
              <MotionDiv
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="rounded-xl border border-border bg-muted/50 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge>{item.politician.name}</Badge>
                  <Badge>{item.topic.name}</Badge>
                </div>
                <p className="text-sm">{item.claim_summary}</p>
                <p className="mt-2 text-xs text-foreground/60">“{item.evidence_quote}”</p>
                <a href={item.source_url} className="mt-1 block text-xs text-primary hover:underline" target="_blank">
                  Kilde
                </a>
              </MotionDiv>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Browse</CardTitle>
          <CardDescription>Søg efter politiker eller emne.</CardDescription>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase text-foreground/60">Politikere</p>
              <div className="space-y-2">
                {politicians.items.slice(0, 10).map((p) => (
                  <a key={p.id} href={`/p/${p.id}`} className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase text-foreground/60">Topics</p>
              <div className="space-y-2">
                {topics.items.slice(0, 10).map((t) => (
                  <a key={t.id} href={`/t/${t.slug}`} className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                    {t.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
