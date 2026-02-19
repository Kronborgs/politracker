import { createHash } from "node:crypto";

export type TextChunk = {
  chunk: string;
  hash: string;
  idx: number;
};

export function hashContent(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function chunkText(text: string, chunkSize = 500, overlap = 80): TextChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({
        chunk,
        hash: hashContent(`${idx}:${chunk}`),
        idx
      });
      idx += 1;
    }

    if (end === normalized.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

export function capSnippet(text: string, max = 240): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

export function domainFromUrl(url: string): string {
  return new URL(url).hostname.toLowerCase();
}
