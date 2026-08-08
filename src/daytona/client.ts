import { Daytona, type Sandbox } from "@daytona/sdk";
import type { AppConfig } from "../config.js";

export function createDaytonaClient(config: AppConfig): Daytona {
  const { daytona } = config;

  return new Daytona({
    apiKey: daytona.apiKey,
    ...(daytona.apiUrl ? { apiUrl: daytona.apiUrl } : {}),
    ...(daytona.target ? { target: daytona.target } : {}),
  });
}

export type SandboxSessionOptions = {
  /** Sandbox language runtime. Expense analysis uses Python. */
  language?: "python" | "typescript" | "javascript";
  /** Auto-delete sandbox after this many minutes when stopped (0 = immediate). */
  autoDeleteInterval?: number;
};

/**
 * Runs `fn` with a fresh Daytona sandbox; always deletes the sandbox afterward.
 */
export async function withSandbox<T>(
  daytona: Daytona,
  fn: (sandbox: Sandbox) => Promise<T>,
  options: SandboxSessionOptions = {},
): Promise<T> {
  const sandbox = await daytona.create({
    language: options.language ?? "python",
    autoDeleteInterval: options.autoDeleteInterval ?? 60,
  });

  try {
    return await fn(sandbox);
  } finally {
    try {
      await daytona.delete(sandbox);
    } catch {
      // Best-effort cleanup; TTL may already remove the sandbox.
    }
  }
}
