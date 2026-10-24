// Đóng gói worker và script migrate thành file .mjs độc lập cho image Docker.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: {
    worker: path.join(root, "src/worker/index.ts"),
    migrate: path.join(root, "src/db/migrate.ts"),
  },
  outdir: path.join(root, "dist"),
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: true,
  external: ["pg-native"],
  alias: { "server-only": path.join(root, "scripts/empty.js") },
  tsconfig: path.join(root, "tsconfig.json"),
  // Một số thư viện CommonJS gọi require() — cung cấp require trong bundle ESM
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: "info",
});
