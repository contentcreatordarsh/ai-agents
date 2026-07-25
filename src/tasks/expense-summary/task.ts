import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Daytona } from "@daytona/sdk";
import { withSandbox } from "../../daytona/client.js";
import { TaskAgent } from "../../agents/task-agent.js";
import type { LlmClient } from "../../llm/types.js";
import {
  expenseAnalysisSchema,
  type ExpenseAnalysis,
} from "./types.js";

const REMOTE_DATA_DIR = "expenses";
const REMOTE_SCRIPT = "analyze_expenses.py";

export type ExpenseSummaryInput = {
  /** Folder with .csv / .tsv exports (local path). */
  inputDir: string;
  /** Calendar month to summarize, e.g. 2026-06 */
  month: string;
  /** Where to write the markdown report (local path). */
  outputPath?: string;
};

export type ExpenseSummaryResult = {
  analysis: ExpenseAnalysis;
  reportPath: string;
  reportMarkdown: string;
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function scriptPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "analyze_expenses.py");
}

async function listUploadableFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext === ".csv" || ext === ".tsv") {
      files.push(path.join(dir, entry.name));
    }
  }
  return files.sort();
}

async function runAnalysisInDaytona(
  daytona: Daytona,
  input: ExpenseSummaryInput,
  localFiles: string[],
): Promise<ExpenseAnalysis> {
  const pySource = await readFile(scriptPath(), "utf8");

  return withSandbox(
    daytona,
    async (sandbox) => {
      await sandbox.fs.createFolder(REMOTE_DATA_DIR, "755");

      for (const localPath of localFiles) {
        const name = path.basename(localPath);
        await sandbox.fs.uploadFile(localPath, `${REMOTE_DATA_DIR}/${name}`);
      }

      await sandbox.fs.uploadFile(
        Buffer.from(pySource, "utf8"),
        REMOTE_SCRIPT,
      );

      const run = await sandbox.process.executeCommand(
        `python3 ${REMOTE_SCRIPT} ${REMOTE_DATA_DIR} ${input.month}`,
        undefined,
        undefined,
        120,
      );

      if (run.exitCode !== 0) {
        const detail = run.result || run.artifacts?.stdout || "unknown error";
        throw new Error(`Expense analysis failed in sandbox: ${detail}`);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(run.result.trim());
      } catch {
        throw new Error(
          `Sandbox did not return valid JSON. Output: ${run.result.slice(0, 500)}`,
        );
      }

      return expenseAnalysisSchema.parse(parsed);
    },
    { language: "python" },
  );
}

const SUMMARY_SYSTEM_PROMPT = `You are a personal finance assistant. You receive structured JSON from a monthly expense analysis pipeline.

Write a clear, concise monthly expense summary in Markdown for the account owner.

Include:
- A short executive overview (spending vs income, net)
- Category breakdown with insights (not just repeating numbers)
- Notable merchants or patterns
- 2–4 practical suggestions (savings, subscriptions to review, anomalies)

Use USD formatting. Do not invent transactions that are not in the data. If transaction_count is 0, explain that no rows matched the month and suggest checking export dates and column headers.`;

async function writeReport(
  input: ExpenseSummaryInput,
  markdown: string,
): Promise<string> {
  const reportPath =
    input.outputPath ??
    path.join("reports", `${input.month}-expense-summary.md`);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, markdown, "utf8");
  return reportPath;
}

export async function runExpenseSummaryTask(
  daytona: Daytona,
  llm: LlmClient,
  input: ExpenseSummaryInput,
): Promise<ExpenseSummaryResult> {
  if (!MONTH_RE.test(input.month)) {
    throw new Error(`Invalid month "${input.month}". Use YYYY-MM (e.g. 2026-06).`);
  }

  const localFiles = await listUploadableFiles(input.inputDir);
  if (localFiles.length === 0) {
    throw new Error(
      `No .csv or .tsv files found in ${input.inputDir}. Export your bank or card activity and place files there.`,
    );
  }

  const analysis = await runAnalysisInDaytona(daytona, input, localFiles);

  const agent = new TaskAgent(llm, { systemPrompt: SUMMARY_SYSTEM_PROMPT });
  const reportMarkdown = await agent.run(
    `Month: ${input.month}\n\nAnalysis JSON:\n${JSON.stringify(analysis, null, 2)}`,
  );

  const reportPath = await writeReport(input, reportMarkdown);

  return { analysis, reportPath, reportMarkdown };
}
