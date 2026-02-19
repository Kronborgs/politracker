"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Entity = { id: string; name: string };

export default function AdminAnalyzePage() {
  const [politicians, setPoliticians] = useState<Entity[]>([]);
  const [topics, setTopics] = useState<Entity[]>([]);
  const [politicianId, setPoliticianId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([apiFetch<{ items: Entity[] }>("politicians"), apiFetch<{ items: Entity[] }>("topics")]).then(([p, t]) => {
      setPoliticians(p.items);
      setTopics(t.items);
      if (p.items[0]) setPoliticianId(p.items[0].id);
      if (t.items[0]) setTopicId(t.items[0].id);
    });
  }, []);

  const run = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch(
        "analyze",
        {
          method: "POST",
          body: JSON.stringify({ politician_id: politicianId, topic_id: topicId, query })
        },
        token
      );
      toast.success("Analyze completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analyze failed");
    }
  };

  return (
    <Card>
      <CardTitle>Analyze statement</CardTitle>
      <div className="mt-4 grid gap-3">
        <select className="rounded-xl border border-border bg-card/80 px-3 py-2" value={politicianId} onChange={(e) => setPoliticianId(e.target.value)}>
          {politicians.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className="rounded-xl border border-border bg-card/80 px-3 py-2" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Input placeholder="Query" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={run}>Run analyze</Button>
      </div>
    </Card>
  );
}
