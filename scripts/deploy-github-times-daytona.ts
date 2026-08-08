#!/usr/bin/env npx tsx
/**
 * Deploy The GitHub Times into a Daytona sandbox and print a signed preview URL.
 * Uses snapshot cursor-github-times-v1 when available (fast path).
 */
import "dotenv/config";
import {
  createDaytonaClient,
  ensureLocalBuild,
  GITHUB_TIMES_PORT,
  GITHUB_TIMES_SNAPSHOT,
  packGithubTimesArchive,
  provisionGithubTimesInSandbox,
  startGithubTimesServer,
  waitForGithubTimesHealthy,
  writeGithubTokenEnv,
} from "./lib/github-times-sandbox.js";
import type { Sandbox } from "@daytona/sdk";

function log(section: string, message: string) {
  console.log(`\n=== ${section} ===\n${message}`);
}

async function createSandboxFromSnapshot(
  daytona: ReturnType<typeof createDaytonaClient>,
  snapshotName: string,
): Promise<Sandbox | null> {
  try {
    const snap = await daytona.snapshot.get(snapshotName);
    if (snap.state !== "active") {
      console.warn(`Snapshot "${snapshotName}" state is ${snap.state}; using full provision.`);
      return null;
    }
    return await daytona.create({
      snapshot: snapshotName,
      language: "typescript",
      autoDeleteInterval: 120,
      public: true,
    });
  } catch {
    return null;
  }
}

async function main() {
  const daytona = createDaytonaClient();
  const snapshotName =
    process.env.DAYTONA_SNAPSHOT ?? GITHUB_TIMES_SNAPSHOT;
  const useSnapshot = process.env.DAYTONA_SKIP_SNAPSHOT !== "true";

  let sandbox: Sandbox | null = null;
  let provisionMode: "snapshot" | "full" = "full";

  if (useSnapshot) {
    log("Snapshot", `Trying snapshot "${snapshotName}"…`);
    sandbox = await createSandboxFromSnapshot(daytona, snapshotName);
    if (sandbox) provisionMode = "snapshot";
  }

  if (!sandbox) {
    log("Build", "Snapshot unavailable — full provision path…");
    ensureLocalBuild();
    packGithubTimesArchive();
    log("Sandbox", "Creating fresh Daytona sandbox…");
    sandbox = await daytona.create({
      language: "typescript",
      autoDeleteInterval: 120,
      public: true,
    });
    await provisionGithubTimesInSandbox(sandbox);
  }

  const sandboxId = sandbox.id;
  console.log(`Sandbox ID: ${sandboxId} (${provisionMode})`);

  try {
    const hasToken = await writeGithubTokenEnv(sandbox);
    console.log(
      hasToken
        ? "GitHub token: written to .env.local (live API)"
        : "GitHub token: not set",
    );

    log("Start", `Starting Next.js on port ${GITHUB_TIMES_PORT}…`);
    const pid = await startGithubTimesServer(sandbox);
    console.log(`Start PID: ${pid}`);

    log("Health", "Waiting for HTTP readiness…");
    const healthOutput = await waitForGithubTimesHealthy(sandbox);

    const signed = await sandbox.getSignedPreviewUrl(GITHUB_TIMES_PORT, 3600);
    const apiProbe = await sandbox.process.executeCommand(
      `curl -s 'http://127.0.0.1:${GITHUB_TIMES_PORT}/api/repos?range=daily' | head -c 600`,
      undefined,
      undefined,
      20,
    );

    log("SUCCESS", [
      `Provision mode: ${provisionMode}`,
      `Snapshot: ${provisionMode === "snapshot" ? snapshotName : "n/a"}`,
      `Sandbox ID: ${sandboxId}`,
      `Daytona signed preview URL (valid 1 hour):`,
      signed.url,
      "",
      "Homepage snippet:",
      healthOutput.slice(0, 800),
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
          port: GITHUB_TIMES_PORT,
          provisionMode,
          snapshot: provisionMode === "snapshot" ? snapshotName : null,
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
