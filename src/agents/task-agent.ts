import type { LlmClient, ChatMessage } from "../llm/types.js";

export type TaskAgentOptions = {
  systemPrompt: string;
  maxRetries?: number;
};

/**
 * Thin wrapper: one structured LLM call with optional retry on empty output.
 */
export class TaskAgent {
  constructor(
    private readonly llm: LlmClient,
    private readonly options: TaskAgentOptions,
  ) {}

  async run(userPrompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: this.options.systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const retries = this.options.maxRetries ?? 1;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.llm.complete(messages);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Task agent failed after retries.");
  }
}
