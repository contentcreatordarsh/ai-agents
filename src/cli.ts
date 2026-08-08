#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { createDaytonaClient } from "./daytona/client.js";
import { createLlmClient } from "./llm/create-client.js";
import { runExpenseSummaryTask } from "./tasks/expense-summary/task.js";

const program = new Command();

program
  .name("ai-agents")
  .description("Simple task agents with Daytona execution")
  .version("0.1.0");

program
  .command("expense-summary")
  .description("Build a monthly expense summary from CSV exports (runs parsing in Daytona)")
  .requiredOption("-m, --month <YYYY-MM>", "Month to summarize")
  .option(
    "-i, --input <dir>",
    "Directory with bank/card CSV or TSV exports",
    "data/expenses",
  )
  .option(
    "-o, --output <file>",
    "Markdown report path (default: reports/<month>-expense-summary.md)",
  )
  .action(async (opts: { month: string; input: string; output?: string }) => {
    const config = loadConfig();
    const daytona = createDaytonaClient(config);
    const llm = createLlmClient(config);

    const result = await runExpenseSummaryTask(daytona, llm, {
      month: opts.month,
      inputDir: opts.input,
      outputPath: opts.output,
    });

    console.log(`\nReport written to: ${result.reportPath}`);
    console.log(
      `Transactions: ${result.analysis.transaction_count} | Spend: $${result.analysis.total_spend.toFixed(2)} | Net: $${result.analysis.net.toFixed(2)}\n`,
    );
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
