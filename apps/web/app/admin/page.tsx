"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Stats = { sources: number; statements: number; changes: number; latest_ingest: string | null; latest_analyze: string | null };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiFetch<Stats>("admin/stats", {}, token).then(setStats).catch(() => null);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {["sources", "statements", "changes", "latest"].map((key) => (
        <Card key={key}>
          <CardTitle className="capitalize">{key}</CardTitle>
          {!stats && <Skeleton className="mt-3 h-8 w-20" />}
          {stats && (
            <p className="mt-3 text-2xl font-semibold">
              {key === "sources" && stats.sources}
              {key === "statements" && stats.statements}
              {key === "changes" && stats.changes}
              {key === "latest" && (stats.latest_analyze ? new Date(stats.latest_analyze).toLocaleString() : "N/A")}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
