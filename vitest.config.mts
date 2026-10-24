import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "scripts/empty.js"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Test database dùng chung → chạy tuần tự
    fileParallelism: false,
  },
});
