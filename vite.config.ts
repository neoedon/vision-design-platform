import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const syncScriptPath = path.join(repoRoot, "scripts/sync-feishu-design-projects.mjs");
const snapshotPath = path.join(repoRoot, "public/data/feishu-base-snapshot.json");

function isLocalRequest(req: IncomingMessage) {
  const remoteAddress = req.socket.remoteAddress;
  return (
    !remoteAddress ||
    remoteAddress === "::1" ||
    remoteAddress === "127.0.0.1" ||
    remoteAddress === "::ffff:127.0.0.1"
  );
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function parseCliJson(stdout: string) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");

  if (start < 0 || end < start) {
    return null;
  }

  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

function runDesignProjectSync(env: NodeJS.ProcessEnv) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [syncScriptPath], {
      cwd: repoRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          stderr.trim() || stdout.trim() || `design project sync exited with code ${code}`,
        ),
      );
    });
  });
}

function designProjectSyncApi(env: Record<string, string>): Plugin {
  const syncEnv = { ...process.env, ...env };

  return {
    name: "design-project-sync-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/design-projects/sync", async (req, res) => {
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          sendJson(res, 405, { ok: false, message: "POST required" });
          return;
        }

        if (!isLocalRequest(req)) {
          sendJson(res, 403, { ok: false, message: "Local requests only" });
          return;
        }

        try {
          const { stdout } = await runDesignProjectSync(syncEnv);
          const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));

          sendJson(res, 200, {
            ok: true,
            sync: parseCliJson(stdout),
            snapshot: {
              syncedAt: snapshot.syncedAt,
              source: {
                title: snapshot.source?.title,
                tableName: snapshot.source?.tableName,
                syncMode: snapshot.source?.syncMode,
              },
              summary: snapshot.summary,
            },
          });
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            message: error instanceof Error ? error.message : "design project sync failed",
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");

  return {
    base: (env.GITHUB_PAGES ?? process.env.GITHUB_PAGES) === "true" ? "/vision-design-platform/" : "/",
    plugins: [react(), designProjectSyncApi(env)],
  };
});
