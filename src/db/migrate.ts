// Chạy khi container khởi động: kiểm tra .env rồi cập nhật cấu trúc database.
// Dùng advisory lock để container app và worker có thể cùng gọi mà không đụng nhau.
import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";

const MIGRATION_LOCK = 72_710_301;

async function main() {
  let databaseUrl: string;
  try {
    databaseUrl = getEnv().DATABASE_URL;
  } catch (e) {
    console.error(`\n✋ ${(e as Error).message}\n\nSửa file .env rồi chạy lại: docker compose up -d\n`);
    process.exit(1);
  }

  // Một kết nối duy nhất: advisory lock gắn với kết nối giữ nó
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle(pool, { casing: "snake_case" });
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), "drizzle");

  try {
    await db.execute(sql`select pg_advisory_lock(${MIGRATION_LOCK})`);
    await migrate(db, { migrationsFolder });
    await db.execute(sql`select pg_advisory_unlock(${MIGRATION_LOCK})`);
    console.log("✓ Database đã cập nhật");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("✋ Cập nhật database thất bại:", e instanceof Error ? e.message : e);
  process.exit(1);
});
