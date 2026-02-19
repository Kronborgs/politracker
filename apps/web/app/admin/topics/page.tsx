"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Topic = { id: string; name: string; slug: string };

export default function AdminTopicsPage() {
  const [items, setItems] = useState<Topic[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [edit, setEdit] = useState<Record<string, { name: string; slug: string }>>({});

  const load = () => apiFetch<{ items: Topic[] }>("topics").then((d) => setItems(d.items));
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch("topics", { method: "POST", body: JSON.stringify({ name, slug }) }, token);
      setName("");
      setSlug("");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  };

  const save = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const current = edit[id];
    if (!current) return;
    try {
      await apiFetch(`topics/${id}`, { method: "PUT", body: JSON.stringify(current) }, token);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  return (
    <Card>
      <CardTitle>Topics</CardTitle>
      <div className="mt-4 flex gap-2">
        <Input placeholder="Navn" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Button onClick={create}>Add</Button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border px-3 py-2 text-sm">
            <div className="flex gap-2">
              <Input
                value={edit[item.id]?.name ?? item.name}
                onChange={(e) =>
                  setEdit((prev) => ({ ...prev, [item.id]: { name: e.target.value, slug: prev[item.id]?.slug ?? item.slug } }))
                }
              />
              <Input
                value={edit[item.id]?.slug ?? item.slug}
                onChange={(e) =>
                  setEdit((prev) => ({ ...prev, [item.id]: { name: prev[item.id]?.name ?? item.name, slug: e.target.value } }))
                }
              />
              <Button size="sm" onClick={() => save(item.id)}>
                Save
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
