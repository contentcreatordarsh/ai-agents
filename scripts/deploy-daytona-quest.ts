#!/usr/bin/env npx tsx
/** Deploy Daytona Sandbox Quest to a Daytona sandbox (port 3001). */
import "dotenv/config";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Daytona } from "@daytona/sdk";

const PORT = 3001;
const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../daytona-quest");
const ARCHIVE = "/tmp/daytona-quest-deploy.tgz";

async function main() {
  if (!process.env.DAYTONA_API_KEY) throw new Error("DAYTONA_API_KEY required");
  if (!existsSync(path.join(APP_DIR, ".next"))) {
    execSync("npm ci && npm run build", { cwd: APP_DIR, stdio: "inherit" });
  }
  execSync(`tar -czf ${ARCHIVE} --exclude=node_modules -C ${path.dirname(APP_DIR)} ${path.basename(APP_DIR)}`);

  const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
  const sandbox = await daytona.create({ language: "typescript", autoDeleteInterval: 120, public: true });
  console.log(`Sandbox: ${sandbox.id}`);

  try {
    await sandbox.fs.uploadFile(ARCHIVE, "quest.tgz");
    const setup = await sandbox.process.executeCommand(
      "mkdir -p app && tar -xzf quest.tgz -C app && cd app/daytona-quest && npm ci --omit=dev",
      undefined,
      undefined,
      300,
    );
    if (setup.exitCode !== 0) throw new Error(setup.result);

    if (process.env.DAYTONA_API_KEY) {
      await sandbox.fs.uploadFile(
        Buffer.from(
          `DAYTONA_API_KEY=${process.env.DAYTONA_API_KEY}\nRUNNING_IN_SANDBOX=true\n`,
          "utf8",
        ),
        "app/daytona-quest/.env.local",
      );
    } else {
      await sandbox.fs.uploadFile(
        Buffer.from("RUNNING_IN_SANDBOX=true\n", "utf8"),
        "app/daytona-quest/.env.local",
      );
    }

    await sandbox.process.executeCommand(
      `cd app/daytona-quest && nohup npm run start > /tmp/quest.log 2>&1 &`,
      undefined,
      undefined,
      20,
    );

    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const p = await sandbox.process.executeCommand(
        `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PORT}/`,
        undefined,
        undefined,
        10,
      );
      if (p.result.trim() === "200") break;
    }

    const signed = await sandbox.getSignedPreviewUrl(PORT, 3600);
    console.log("\n=== Daytona Sandbox Quest LIVE ===");
    console.log(signed.url);
    console.log(JSON.stringify({ sandboxId: sandbox.id, previewUrl: signed.url, port: PORT }, null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

main();
