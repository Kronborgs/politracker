"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminIngestPage() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const run = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch(
        "ingest",
        {
          method: "POST",
          body: JSON.stringify({ url, text, meta: { title } })
        },
        token
      );
      toast.success("Ingest completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ingest failed");
    }
  };

  return (
    <Card>
      <CardTitle>Ingest source</CardTitle>
      <div className="mt-4 space-y-3">
        <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="h-56 w-full rounded-xl border border-border bg-card/80 p-3 text-sm"
          placeholder="Paste source text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={run}>Run ingest</Button>
      </div>
    </Card>
  );
}
