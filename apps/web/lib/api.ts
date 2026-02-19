import { apiBaseInternal } from "./config";

export async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(options?.headers || {});
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`/api/${path.replace(/^\//, "")}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let message = `API request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function serverApiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBaseInternal}/${path.replace(/^\//, "")}`, {
    cache: "no-store"
  });

  if (!res.ok) throw new Error(`Server API failed: ${res.status}`);
  return res.json() as Promise<T>;
}
