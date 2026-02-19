import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDb } from "./db/client";
import { users } from "./db/schema";
import { readEnv } from "./env";
import { buildApp } from "./app";
import { OllamaService } from "./services/ollama";
import { QdrantService } from "./services/qdrant";

async function seedAdmin() {
  const env = readEnv();
  const { db, pool } = createDb(env);

  const existing = await db.query.users.findFirst({ where: eq(users.email, env.ADMIN_EMAIL) });
  if (!existing) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await db.insert(users).values({
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: "admin"
    });
  }

  await pool.end();
}

async function main() {
  const env = readEnv();
  const { db, pool } = createDb(env);

  await seedAdmin();

  const ollama = new OllamaService(env.OLLAMA_URL, env.EMBED_MODEL, env.LLM_MODEL);
  const qdrant = new QdrantService(env.QDRANT_URL, env.QDRANT_COLLECTION);

  const app = await buildApp({ config: env, db, ollama, qdrant });

  const shutdown = async () => {
    await app.close();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
