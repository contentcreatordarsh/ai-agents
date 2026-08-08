#!/usr/bin/env npx tsx
/**
 * Capture a Daytona snapshot from a fully provisioned GitHub Times sandbox.
 * Snapshot name: cursor-github-times-v1 (cursor-[project]-[version])
 *
 * Requires DAYTONA_API_KEY with write:sandboxes and write:snapshots.
 */
import "dotenv/config";
import {
  createDaytonaClient,
  ensureLocalBuild,
  GITHUB_TIMES_SNAPSHOT,
  packGithubTimesArchive,
  provisionGithubTimesInSandbox,
} from "./lib/github-times-sandbox.js";

const SNAPSHOT_TIMEOUT_SEC = 600;

function log(section: string, message: string) {
  console.log(`\n=== ${section} ===\n${message}`);
}

async function replaceExistingSnapshot(
  daytona: ReturnType<typeof createDaytonaClient>,
  name: string,
): Promise<void> {
  try {
    const existing = await daytona.snapshot.get(name);
    log("Snapshot", `Replacing existing snapshot "${name}" (state: ${existing.state})…`);
    await daytona.snapshot.delete(existing);
  } catch {
    log("Snapshot", `No existing snapshot named "${name}" — creating fresh.`);
  }
}

async function main() {
  const snapshotName =
    process.env.DAYTONA_SNAPSHOT_NAME ?? GITHUB_TIMES_SNAPSHOT;

  log("Build", "Ensuring local production build exists…");
  ensureLocalBuild();

  log("Pack", "Archiving github-times (includes .next)…");
  packGithubTimesArchive();

  const daytona = createDaytonaClient();
  await replaceExistingSnapshot(daytona, snapshotName);

  log("Sandbox", "Creating provisioning sandbox…");
  const sandbox = await daytona.create({
    language: "typescript",
    autoDeleteInterval: 0,
    public: true,
  });

  console.log(`Sandbox ID: ${sandbox.id}`);

  try {
    log("Provision", "Installing GitHub Times into sandbox (no secrets baked in)…");
    await provisionGithubTimesInSandbox(sandbox);

    log("Snapshot", `Creating snapshot "${snapshotName}" (timeout ${SNAPSHOT_TIMEOUT_SEC}s)…`);
    await sandbox._experimental_createSnapshot(snapshotName, SNAPSHOT_TIMEOUT_SEC);

    const snapshot = await daytona.snapshot.get(snapshotName);

    log("SUCCESS", [
      `Snapshot name: ${snapshot.name}`,
      `Snapshot state: ${snapshot.state}`,
      `Image: ${snapshot.imageName}`,
      `Created: ${snapshot.createdAt}`,
      "",
      "Next deploy:",
      `  DAYTONA_SNAPSHOT=${snapshotName} npm run deploy:github-times`,
    ].join("\n"));

    console.log("\n--- JSON ---");
    console.log(
      JSON.stringify(
        {
          snapshotName: snapshot.name,
          snapshotState: snapshot.state,
          imageName: snapshot.imageName,
          sandboxId: sandbox.id,
          usage: `daytona.create({ snapshot: "${snapshotName}" })`,
        },
        null,
        2,
      ),
    );
  } finally {
    try {
      await daytona.delete(sandbox);
      console.log("\nProvisioning sandbox deleted.");
    } catch {
      console.log("\nProvisioning sandbox cleanup skipped (may already be removed).");
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
