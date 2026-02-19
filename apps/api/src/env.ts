import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url(),
  QDRANT_URL: z.string().url(),
  QDRANT_COLLECTION: z.string().default("politracker_chunks"),
  OLLAMA_URL: z.string().url(),
  EMBED_MODEL: z.string().default("nomic-embed-text"),
  LLM_MODEL: z.string().default("qwen2.5:7b-instruct"),
  APP_VERSION: z.string().default("dev"),
  GIT_SHA: z.string().default("local"),
  BUILD_TIME: z.string().default(new Date(0).toISOString()),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  JWT_SECRET: z.string().min(16)
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(): AppEnv {
  return envSchema.parse(process.env);
}
