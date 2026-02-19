"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [embedModel, setEmbedModel] = useState("nomic-embed-text");
  const [llmModel, setLlmModel] = useState("qwen2.5:7b-instruct");
  const [promptVersion, setPromptVersion] = useState("stance_v1");

  return (
    <Card>
      <CardTitle>Settings</CardTitle>
      <CardDescription>UI til model/præference-oversigt (kan kobles direkte til API senere).</CardDescription>
      <div className="mt-4 space-y-3">
        <Input value={embedModel} onChange={(e) => setEmbedModel(e.target.value)} />
        <Input value={llmModel} onChange={(e) => setLlmModel(e.target.value)} />
        <Input value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)} />
        <Button variant="outline">Gem (UI placeholder)</Button>
      </div>
    </Card>
  );
}
