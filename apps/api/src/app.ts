import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema";
import { AppEnv } from "./env";
import { OllamaService } from "./services/ollama";
import { QdrantService } from "./services/qdrant";
import authPlugin from "./plugins/auth";
import { registerRoutes } from "./routes/index";

declare module "fastify" {
  interface FastifyInstance {
    config: AppEnv;
    db: NodePgDatabase<typeof schema>;
    ollama: OllamaService;
    qdrant: QdrantService;
  }
}

export async function buildApp(args: {
  config: AppEnv;
  db: NodePgDatabase<typeof schema>;
  ollama: OllamaService;
  qdrant: QdrantService;
}) {
  const app = Fastify({ logger: true });

  app.decorate("config", args.config);
  app.decorate("db", args.db);
  app.decorate("ollama", args.ollama);
  app.decorate("qdrant", args.qdrant);

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"]
  });
  await app.register(sensible);
  await app.register(jwt, { secret: args.config.JWT_SECRET });
  await app.register(authPlugin);
  await registerRoutes(app);

  return app;
}
