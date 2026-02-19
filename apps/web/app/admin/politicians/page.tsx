"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Politician = { id: string; name: string; party?: string };

export default function AdminPoliticiansPage() {
  const [items, setItems] = useState<Politician[]>([]);
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [edit, setEdit] = useState<Record<string, { name: string; party: string }>>({});

  const load = () => apiFetch<{ items: Politician[] }>("politicians").then((d) => setItems(d.items));
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch("politicians", { method: "POST", body: JSON.stringify({ name, party, active: true }) }, token);
      setName("");
      setParty("");
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
      await apiFetch(`politicians/${id}`, { method: "PUT", body: JSON.stringify(current) }, token);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  return (
    <Card>
      <CardTitle>Politicians</CardTitle>
      <div className="mt-4 flex gap-2">
        <Input placeholder="Navn" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Parti" value={party} onChange={(e) => setParty(e.target.value)} />
        <Button onClick={create}>Add</Button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border px-3 py-2 text-sm">
            <div className="flex gap-2">
              <Input
                value={edit[item.id]?.name ?? item.name}
                onChange={(e) =>
                  setEdit((prev) => ({ ...prev, [item.id]: { name: e.target.value, party: prev[item.id]?.party ?? item.party ?? "" } }))
                }
              />
              <Input
                value={edit[item.id]?.party ?? item.party ?? ""}
                onChange={(e) =>
                  setEdit((prev) => ({ ...prev, [item.id]: { name: prev[item.id]?.name ?? item.name, party: e.target.value } }))
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
