import type { Sandbox } from "@daytona/sdk";
import type { Mission, MissionRunResult } from "./types";
import { isInDaytonaSandbox, runMissionLocally, runMissionRemote } from "./sandbox-runner";

export const MISSIONS: Mission[] = [
  {
    id: "boot-camp",
    title: "Boot Camp",
    subtitle: "Spawn a sandbox and echo your first signal",
    icon: "🚀",
    difficulty: "easy",
    xp: 50,
    order: 1,
    docRef: { section: "Getting Started", path: "/docs/en/getting-started" },
  },
  {
    id: "python-spark",
    title: "Python Spark",
    subtitle: "Execute Python inside an isolated runtime",
    icon: "🐍",
    difficulty: "easy",
    xp: 75,
    order: 2,
    docRef: { section: "Process & Code Execution", path: "/docs/en/process-code-execution" },
  },
  {
    id: "file-scout",
    title: "File Scout",
    subtitle: "Write a payload and read it back from the sandbox FS",
    icon: "📁",
    difficulty: "medium",
    xp: 100,
    order: 3,
    docRef: { section: "File System Operations", path: "/docs/en/file-system-operations" },
  },
  {
    id: "velocity-run",
    title: "Velocity Run",
    subtitle: "Benchmark command latency in this environment",
    icon: "⚡",
    difficulty: "medium",
    xp: 125,
    order: 4,
    docRef: { section: "Sandboxes", path: "/docs/en/sandboxes" },
  },
  {
    id: "multi-lingual",
    title: "Polyglot Pulse",
    subtitle: "Run Python and Node in one mission chain",
    icon: "🌐",
    difficulty: "hard",
    xp: 150,
    order: 5,
    docRef: { section: "TypeScript SDK", path: "/docs/en/typescript-sdk" },
  },
  {
    id: "clean-exit",
    title: "Clean Exit",
    subtitle: "Verify process hygiene before mission complete",
    icon: "🛡️",
    difficulty: "easy",
    xp: 60,
    order: 6,
    docRef: { section: "Sandbox Lifecycle", path: "/docs/en/sandboxes#sandbox-lifecycle" },
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

async function runBootCampRemote(sandbox: Sandbox): Promise<string> {
  const res = await sandbox.process.executeCommand('echo "SANDBOX_ONLINE"', undefined, undefined, 30);
  if (res.exitCode !== 0) throw new Error(res.result || "Command failed");
  return res.result.trim();
}

async function runBootCampLocal(execCmd: (c: string) => Promise<string>): Promise<string> {
  return execCmd('echo "SANDBOX_ONLINE"');
}

async function runPythonSparkRemote(sandbox: Sandbox): Promise<string> {
  const res = await sandbox.process.codeRun(
    `import platform\nprint(f"PYTHON_{platform.python_version()}")`,
    undefined,
    60,
  );
  if (res.exitCode !== 0) throw new Error(res.result || "Python failed");
  return res.result.trim();
}

async function runPythonSparkLocal(execCmd: (c: string) => Promise<string>): Promise<string> {
  return execCmd('python3 -c "import platform; print(f\\"PYTHON_{platform.python_version()}\\")"');
}

async function runFileScoutRemote(sandbox: Sandbox): Promise<string> {
  const payload = "quest://daytona-file-scout-ok";
  await sandbox.fs.uploadFile(Buffer.from(payload, "utf8"), "quest/payload.txt");
  const res = await sandbox.process.executeCommand("cat quest/payload.txt", undefined, undefined, 20);
  if (res.exitCode !== 0 || !res.result.includes("file-scout")) throw new Error("File read mismatch");
  return res.result.trim();
}

async function runFileScoutLocal(execCmd: (c: string) => Promise<string>): Promise<string> {
  await execCmd('mkdir -p quest && echo "quest://daytona-file-scout-ok" > quest/payload.txt');
  const out = await execCmd("cat quest/payload.txt");
  if (!out.includes("file-scout")) throw new Error("File read mismatch");
  return out;
}

async function runVelocityRemote(sandbox: Sandbox): Promise<string> {
  const t0 = Date.now();
  const res = await sandbox.process.executeCommand(
    'node -e "console.log(\\"VELOCITY_OK\\")"',
    undefined,
    undefined,
    30,
  );
  const ms = Date.now() - t0;
  if (res.exitCode !== 0) throw new Error(res.result || "Velocity check failed");
  return `${res.result.trim()} | exec ${ms}ms`;
}

async function runVelocityLocal(execCmd: (c: string) => Promise<string>): Promise<string> {
  const t0 = Date.now();
  const out = await execCmd('node -e "console.log(\\"VELOCITY_OK\\")"');
  return `${out} | exec ${Date.now() - t0}ms`;
}

async function runPolyglotRemote(sandbox: Sandbox): Promise<string> {
  const py = await sandbox.process.executeCommand(
    'python3 -c "print(\\"POLYGLOT_PY\\")"',
    undefined,
    undefined,
    30,
  );
  const ts = await sandbox.process.executeCommand(
    'node -e "console.log(\\"POLYGLOT_TS\\")"',
    undefined,
    undefined,
    30,
  );
  if (py.exitCode !== 0 || ts.exitCode !== 0) throw new Error("Polyglot chain failed");
  return `${py.result.trim()} + ${ts.result.trim()}`;
}

async function runPolyglotLocal(execCmd: (c: string) => Promise<string>): Promise<string> {
  const py = await execCmd('python3 -c "print(\\"POLYGLOT_PY\\")"');
  const ts = await execCmd('node -e "console.log(\\"POLYGLOT_TS\\")"');
  return `${py} + ${ts}`;
}

async function runCleanExitRemote(sandbox: Sandbox): Promise<string> {
  const res = await sandbox.process.executeCommand("echo CLEAN_EXIT_READY", undefined, undefined, 15);
  if (res.exitCode !== 0) throw new Error(res.result || "Pre-exit failed");
  return `${res.result.trim()} (child sandbox destroyed after mission)`;
}

async function runCleanExitLocal(execCmd: (c: string) => Promise<string>): Promise<string> {
  const out = await execCmd("echo CLEAN_EXIT_READY");
  return `${out} (running in current Daytona sandbox)`;
}

const REMOTE_RUNNERS: Record<string, (s: Sandbox) => Promise<string>> = {
  "boot-camp": runBootCampRemote,
  "python-spark": runPythonSparkRemote,
  "file-scout": runFileScoutRemote,
  "velocity-run": runVelocityRemote,
  "multi-lingual": runPolyglotRemote,
  "clean-exit": runCleanExitRemote,
};

const LOCAL_RUNNERS: Record<string, (e: (c: string) => Promise<string>) => Promise<string>> = {
  "boot-camp": runBootCampLocal,
  "python-spark": runPythonSparkLocal,
  "file-scout": runFileScoutLocal,
  "velocity-run": runVelocityLocal,
  "multi-lingual": runPolyglotLocal,
  "clean-exit": runCleanExitLocal,
};

export async function executeMission(missionId: string): Promise<MissionRunResult> {
  const mission = getMission(missionId);
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);

  const started = Date.now();
  const inSandbox = isInDaytonaSandbox();

  try {
    let output: string;
    let sandboxId: string;
    let durationMs: number;

    if (inSandbox) {
      const localRunner = LOCAL_RUNNERS[missionId];
      if (!localRunner) throw new Error(`No local runner for ${missionId}`);
      const result = await runMissionLocally(missionId, localRunner);
      output = result.output;
      sandboxId = result.sandboxId;
      durationMs = result.durationMs;
    } else {
      const remoteRunner = REMOTE_RUNNERS[missionId];
      if (!remoteRunner) throw new Error(`No remote runner for ${missionId}`);
      const result = await runMissionRemote(remoteRunner);
      output = result.output;
      sandboxId = result.sandboxId;
      durationMs = result.durationMs;
    }

    return {
      missionId,
      title: mission.title,
      success: true,
      xpEarned: mission.xp,
      durationMs,
      sandboxId,
      output: inSandbox ? `${output} [in-sandbox mode]` : output,
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      missionId,
      title: mission.title,
      success: false,
      xpEarned: 0,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Mission failed",
      completedAt: new Date().toISOString(),
    };
  }
}
