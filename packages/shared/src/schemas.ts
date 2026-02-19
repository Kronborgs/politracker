import { z } from "zod";

export const metaSchema = z
  .object({
    domain: z.string().optional(),
    date: z.string().datetime().optional(),
    title: z.string().optional()
  })
  .optional();

export const ingestSchema = z.object({
  url: z.string().url(),
  text: z.string().min(20),
  meta: metaSchema
});

export const analyzeSchema = z.object({
  politician_id: z.string().uuid(),
  topic_id: z.string().uuid(),
  query: z.string().min(5)
});

export const politicianSchema = z.object({
  name: z.string().min(2),
  party: z.string().optional(),
  active: z.boolean().default(true)
});

export const topicSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional()
});

export const sourcePolicyUpdateSchema = z.object({
  allow_ingest: z.boolean().optional(),
  allow_store_snippet: z.boolean().optional(),
  allow_fulltext: z.boolean().optional(),
  snippet_max_len: z.number().int().min(40).max(240).optional(),
  access_tier: z.enum(["public", "restricted", "paywalled"]).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const statementOutputSchema = z.object({
  claim_summary: z.string().min(3),
  stance_label: z.enum(["for", "imod", "uklar"]),
  stance_score: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  evidence_quote: z.string().max(240)
});

export type IngestInput = z.infer<typeof ingestSchema>;
export type AnalyzeInput = z.infer<typeof analyzeSchema>;
export type StatementOutput = z.infer<typeof statementOutputSchema>;
