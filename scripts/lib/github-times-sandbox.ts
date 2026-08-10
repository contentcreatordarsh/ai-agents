import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Daytona, type Sandbox } from "@daytona/sdk";

export const GITHUB_TIMES_SNAPSHOT = "cursor-github-times-v1";
export const GITHUB_TIMES_PORT = 3000;
export const GITHUB_TIMES_APP_REL = "app/github-times";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const GITHUB_TIMES_DIR = path.resolve(SCRIPTS_DIR, "../../github-times");
export const GITHUB_TIMES_ARCHIVE = "/tmp/github-times-deploy.tgz";

export function createDaytonaClient(): Daytona {
  const apiKey = process.env.DAYTONA_API_KEY;
  if (!apiKey) {
    throw new Error("DAYTONA_API_KEY is not set.");
  }
  return new Daytona({
    apiKey,
    ...(process.env.DAYTONA_API_URL
      ? { apiUrl: process.env.DAYTONA_API_URL }
      : {}),
    ...(process.env.DAYTONA_TARGET
      ? { target: process.env.DAYTONA_TARGET }
      : {}),
  });
}

export function ensureLocalBuild(): void {
  const nextDir = path.join(GITHUB_TIMES_DIR, ".next");
  if (!existsSync(nextDir)) {
    execSync("npm ci && npm run build", {
      cwd: GITHUB_TIMES_DIR,
      stdio: "inherit",
    });
  }
}

export function packGithubTimesArchive(): void {
  execSync(
    `tar -czf ${GITHUB_TIMES_ARCHIVE} --exclude=node_modules -C ${path.dirname(GITHUB_TIMES_DIR)} ${path.basename(GITHUB_TIMES_DIR)}`,
    { stdio: "inherit" },
  );
}

/** Install pre-built GitHub Times into a fresh sandbox filesystem. */
export async function provisionGithubTimesInSandbox(
  sandbox: Sandbox,
): Promise<void> {
  await sandbox.fs.uploadFile(GITHUB_TIMES_ARCHIVE, "github-times.tgz");

  const setup = await sandbox.process.executeCommand(
    [
      "set -e",
      "mkdir -p app && tar -xzf github-times.tgz -C app",
      `cd ${GITHUB_TIMES_APP_REL}`,
      "npm ci --omit=dev",
      "printf '#!/bin/sh\\ncd \"$(dirname \"$0\")\"\\nnpm run start\\n' > start.sh",
      "chmod +x start.sh",
    ].join(" && "),
    undefined,
    undefined,
    300,
  );

  if (setup.exitCode !== 0) {
    throw new Error(`Sandbox setup failed:\n${setup.result}`);
  }
}

export async function writeGithubTokenEnv(sandbox: Sandbox): Promise<boolean> {
  if (!process.env.GITHUB_TOKEN) return false;
  await sandbox.fs.uploadFile(
    Buffer.from(`GITHUB_TOKEN=${process.env.GITHUB_TOKEN}\n`, "utf8"),
    `${GITHUB_TIMES_APP_REL}/.env.local`,
  );
  return true;
}

export async function startGithubTimesServer(sandbox: Sandbox): Promise<string> {
  const start = await sandbox.process.executeCommand(
    `cd ${GITHUB_TIMES_APP_REL} && nohup ./start.sh > /tmp/github-times.log 2>&1 & echo $!`,
    undefined,
    undefined,
    30,
  );
  return start.result.trim();
}

export async function waitForGithubTimesHealthy(
  sandbox: Sandbox,
  port = GITHUB_TIMES_PORT,
): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const probe = await sandbox.process.executeCommand(
      `curl -s -o /tmp/body.html -w "%{http_code}" http://127.0.0.1:${port}/ || true`,
      undefined,
      undefined,
      15,
    );
    if (probe.result.trim() === "200") {
      const body = await sandbox.process.executeCommand(
        "head -c 1200 /tmp/body.html",
        undefined,
        undefined,
        10,
      );
      return body.result;
    }
  }
  const logs = await sandbox.process.executeCommand(
    "tail -80 /tmp/github-times.log || true",
    undefined,
    undefined,
    10,
  );
  throw new Error(`Server not healthy.\n${logs.result}`);
}
