#!/usr/bin/env npx tsx
/**
 * Deploy The GitHub Times into a Daytona sandbox and print a signed preview URL.
 *
 * Requires DAYTONA_API_KEY in the environment (or .env).
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Daytona } from "@daytona/sdk";

const PORT = 3000;
const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../github-times",
);
const ARCHIVE = "/tmp/github-times-deploy.tgz";

function log(section: string, message: string) {
  console.log(`\n=== ${section} ===\n${message}`);
}

async function main() {
  const apiKey = process.env.DAYTONA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DAYTONA_API_KEY is not set. Add it at https://app.daytona.io/dashboard/keys",
    );
  }

  if (!existsSync(APP_DIR)) {
    throw new Error(`App directory not found: ${APP_DIR}`);
  }

  const nextDir = path.join(APP_DIR, ".next");
  if (!existsSync(nextDir)) {
    log("Build", "Building locally (sandbox OOM-safe prebuild)…");
    execSync("npm ci && npm run build", {
      cwd: APP_DIR,
      stdio: "inherit",
    });
  } else {
    log("Build", "Using existing local .next production build.");
  }

  log("Pack", `Creating archive from ${APP_DIR} (includes .next, excludes node_modules)…`);
  execSync(
    `tar -czf ${ARCHIVE} --exclude=node_modules -C ${path.dirname(APP_DIR)} ${path.basename(APP_DIR)}`,
    { stdio: "inherit" },
  );

  const daytona = new Daytona({
    apiKey,
    ...(process.env.DAYTONA_API_URL
      ? { apiUrl: process.env.DAYTONA_API_URL }
      : {}),
    ...(process.env.DAYTONA_TARGET
      ? { target: process.env.DAYTONA_TARGET }
      : {}),
  });

  log("Sandbox", "Creating Daytona sandbox (Node/TypeScript)…");
  const sandbox = await daytona.create({
    language: "typescript",
    autoDeleteInterval: 120,
    public: true,
  });

  const sandboxId = sandbox.id;
  console.log(`Sandbox ID: ${sandboxId}`);

  try {
    log("Upload", "Uploading application archive…");
    await sandbox.fs.uploadFile(ARCHIVE, "github-times.tgz");

    log("Setup", "Extracting and installing production dependencies (no in-sandbox build)…");
    const setup = await sandbox.process.executeCommand(
      [
        "set -e",
        "mkdir -p app && tar -xzf github-times.tgz -C app",
        "cd app/github-times",
        "npm ci --omit=dev",
      ].join(" && "),
      undefined,
      undefined,
      300,
    );

    if (setup.exitCode !== 0) {
      throw new Error(`Setup failed:\n${setup.result}`);
    }
    console.log(setup.result.slice(-500));

    if (process.env.GITHUB_TOKEN) {
      await sandbox.fs.uploadFile(
        Buffer.from(`GITHUB_TOKEN=${process.env.GITHUB_TOKEN}\n`, "utf8"),
        "app/github-times/.env.local",
      );
      console.log("GitHub token: written to sandbox .env.local (live API enabled)");
    } else {
      console.log("GitHub token: not set (may use mock fallback on rate limits)");
    }

    log("Start", `Starting Next.js on port ${PORT}…`);
    const start = await sandbox.process.executeCommand(
      `cd app/github-times && nohup npm run start > /tmp/server.log 2>&1 & echo $!`,
      undefined,
      undefined,
      30,
    );
    console.log(`Start PID: ${start.result.trim()}`);

    log("Health", "Waiting for HTTP readiness…");
    let healthy = false;
    let healthOutput = "";
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const probe = await sandbox.process.executeCommand(
        `curl -s -o /tmp/body.html -w "%{http_code}" http://127.0.0.1:${PORT}/ || true`,
        undefined,
        undefined,
        15,
      );
      const code = probe.result.trim();
      if (code === "200") {
        healthy = true;
        const body = await sandbox.process.executeCommand(
          "head -c 1200 /tmp/body.html",
          undefined,
          undefined,
          10,
        );
        healthOutput = body.result;
        break;
      }
      console.log(`  attempt ${i + 1}: HTTP ${code}`);
    }

    if (!healthy) {
      const logs = await sandbox.process.executeCommand(
        "tail -80 /tmp/server.log || true",
        undefined,
        undefined,
        10,
      );
      throw new Error(`Server did not become healthy.\n${logs.result}`);
    }

    const signed = await sandbox.getSignedPreviewUrl(PORT, 3600);
    const apiProbe = await sandbox.process.executeCommand(
      `curl -s 'http://127.0.0.1:${PORT}/api/repos?range=daily' | head -c 600`,
      undefined,
      undefined,
      20,
    );

    log("SUCCESS", [
      `Sandbox ID: ${sandboxId}`,
      `Daytona signed preview URL (valid 1 hour):`,
      signed.url,
      "",
      "Homepage snippet (first 1200 chars):",
      healthOutput,
      "",
      "API sample:",
      apiProbe.result,
    ].join("\n"));

    console.log("\n--- JSON ---");
    console.log(
      JSON.stringify(
        {
          sandboxId,
          previewUrl: signed.url,
          port: PORT,
          status: "running",
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log(
      "\nNote: sandbox auto-deletes after idle period (autoDeleteInterval=120 min).",
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
