"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ token: string }>("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.token);
      toast.success("Login succesfuld");
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login fejlede");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <Card>
          <CardTitle>Admin login</CardTitle>
          <CardDescription>Log ind for ingest, analyse og styring.</CardDescription>
          <div className="mt-4 space-y-3">
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={submit} disabled={loading}>
              {loading ? "Logger ind..." : "Log ind"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
