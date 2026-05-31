// Headless production server for the packaged Mac app (Tauri sidecar).
// Prefers the Next.js standalone server (small bundle); falls back to `next start`.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = process.env.PORT || "3777";
// Resolve the DB to an absolute path so it works regardless of the server's cwd
// (the standalone server runs from .next/standalone).
const dbPath = path.join(root, "prisma", "dev.db");
const env = {
  ...process.env,
  PORT: port,
  HOSTNAME: "127.0.0.1",
  DATABASE_URL: process.env.DATABASE_URL_ABS || `file:${dbPath}`,
};

const standalone = path.join(root, ".next", "standalone", "server.js");

let child;
if (fs.existsSync(standalone)) {
  // Standalone server reads PORT/HOSTNAME from env.
  child = spawn(process.execPath, [standalone], { cwd: path.join(root, ".next", "standalone"), stdio: "inherit", env });
} else {
  child = spawn(
    process.execPath,
    [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", port],
    { cwd: root, stdio: "inherit", env }
  );
}

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
