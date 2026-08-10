import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { AppConfig } from "../config.js";
import type { ChatMessage, LlmClient } from "./types.js";

class OpenAiCompatibleClient implements LlmClient {
  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async complete(messages: ChatMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error("LLM returned an empty response.");
    }
    return text;
  }
}

class AnthropicClient implements LlmClient {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async complete(messages: ChatMessage[]): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content;
    const nonSystem = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: nonSystem.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("LLM returned no text block.");
    }
    return block.text;
  }
}

/** Factory for the configured LLM provider (OpenAI-compatible or Anthropic). */
export function createLlmClient(config: AppConfig): LlmClient {
  const { llm } = config;

  if (llm.provider === "anthropic") {
    return new AnthropicClient(
      new Anthropic({ apiKey: llm.anthropicApiKey }),
      llm.model,
    );
  }

  return new OpenAiCompatibleClient(
    new OpenAI({
      apiKey: llm.openaiApiKey,
      ...(llm.openaiBaseUrl ? { baseURL: llm.openaiBaseUrl } : {}),
    }),
    llm.model,
  );
}
