import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppEnv } from "../env";
import * as schema from "./schema";

export function createDb(env: AppEnv) {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  return { db, pool };
}
