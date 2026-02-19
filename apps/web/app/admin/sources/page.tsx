"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Source = {
  id: string;
  url: string;
  domain: string;
  allowIngest: boolean;
  allowStoreSnippet: boolean;
  allowFulltext: boolean;
  accessTier: "public" | "restricted" | "paywalled";
};

export default function AdminSourcesPage() {
  const [items, setItems] = useState<Source[]>([]);
  const [q, setQ] = useState("");

  const load = () =>
    apiFetch<{ items: Source[] }>(`sources?page=1&pageSize=50&q=${encodeURIComponent(q)}`, {}, getToken() || "").then((d) =>
      setItems(d.items)
    );

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      await apiFetch(`sources/${id}`, { method: "PUT", body: JSON.stringify(body) }, getToken() || "");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  return (
    <Card>
      <CardTitle>Sources + domain policy</CardTitle>
      <div className="mt-4 flex gap-2">
        <Input placeholder="Filter URL" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="outline" onClick={load}>Søg</Button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">{item.domain}</p>
            <p className="truncate text-xs text-foreground/60">{item.url}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => patch(item.id, { allow_ingest: !item.allowIngest })}>
                allow_ingest: {String(item.allowIngest)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => patch(item.id, { allow_store_snippet: !item.allowStoreSnippet })}>
                allow_snippet: {String(item.allowStoreSnippet)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => patch(item.id, { access_tier: item.accessTier === "public" ? "restricted" : "public" })}>
                tier: {item.accessTier}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
