import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Sandbox } from "@daytona/sdk";
import { getDaytona } from "./daytona";

const execAsync = promisify(exec);

/** True when the Next.js server is running inside a Daytona sandbox. */
export function isInDaytonaSandbox(): boolean {
  return process.env.RUNNING_IN_SANDBOX === "true";
}

async function runLocalShell(command: string): Promise<{ output: string; durationMs: number }> {
  const t0 = Date.now();
  const { stdout, stderr } = await execAsync(command, {
    timeout: 60_000,
    env: process.env,
  });
  const output = (stdout || stderr || "").trim();
  if (!output && stderr) throw new Error(stderr);
  return { output, durationMs: Date.now() - t0 };
}

/** Run a mission in the current process environment (same Daytona sandbox). */
export async function runMissionLocally(
  missionId: string,
  runner: (execCmd: (cmd: string) => Promise<string>) => Promise<string>,
): Promise<{ output: string; sandboxId: string; durationMs: number }> {
  const started = Date.now();
  const sandboxId =
    process.env.DAYTONA_SANDBOX_ID ?? process.env.HOSTNAME ?? "local-sandbox";

  const execCmd = async (command: string) => {
    const { output } = await runLocalShell(command);
    return output;
  };

  const output = await runner(execCmd);
  return { output, sandboxId, durationMs: Date.now() - started };
}

/** Run a mission by spawning a fresh child Daytona sandbox. */
export async function runMissionRemote(
  runner: (sandbox: Sandbox) => Promise<string>,
): Promise<{ output: string; sandboxId: string; durationMs: number }> {
  const daytona = getDaytona();
  const started = Date.now();
  const sandbox = await daytona.create({
    language: "typescript",
    autoDeleteInterval: 30,
    public: true,
  });

  try {
    const output = await runner(sandbox);
    return { output, sandboxId: sandbox.id, durationMs: Date.now() - started };
  } finally {
    try {
      await daytona.delete(sandbox);
    } catch {
      /* ignore */
    }
  }
}
