import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { __mtDb?: Db; __mtPool?: Pool };

/** Kết nối được tạo khi dùng lần đầu (không tạo lúc build). */
export function getDb(): Db {
  if (!globalForDb.__mtDb) {
    const pool = new Pool({ connectionString: getDatabaseUrl(), max: 10 });
    globalForDb.__mtPool = pool;
    globalForDb.__mtDb = drizzle(pool, { schema, casing: "snake_case" });
  }
  return globalForDb.__mtDb;
}

export async function closeDb() {
  await globalForDb.__mtPool?.end();
  globalForDb.__mtPool = undefined;
  globalForDb.__mtDb = undefined;
}

export { schema };
