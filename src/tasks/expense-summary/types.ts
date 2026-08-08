import { z } from "zod";

export const expenseAnalysisSchema = z.object({
  month: z.string(),
  transaction_count: z.number(),
  total_spend: z.number(),
  total_income: z.number(),
  net: z.number(),
  by_category: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
    }),
  ),
  top_merchants: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
    }),
  ),
  sample_transactions: z.array(
    z.object({
      date: z.string(),
      amount: z.number(),
      description: z.string(),
      category: z.string(),
      source_file: z.string(),
    }),
  ),
});

export type ExpenseAnalysis = z.infer<typeof expenseAnalysisSchema>;
