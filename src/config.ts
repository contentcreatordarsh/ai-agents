import "dotenv/config";
import { z } from "zod";

const daytonaModeSchema = z.enum(["cloud", "self-hosted"]);

const envSchema = z.object({
  DAYTONA_API_KEY: z.string().min(1).optional(),
  DAYTONA_API_URL: z.string().url().optional(),
  DAYTONA_TARGET: z.string().optional(),
  DAYTONA_MODE: daytonaModeSchema.default("cloud"),
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type DaytonaMode = z.infer<typeof daytonaModeSchema>;
export type LlmProvider = "openai" | "anthropic";

export type AppConfig = {
  daytona: {
    mode: DaytonaMode;
    apiKey: string;
    apiUrl?: string;
    target?: string;
  };
  llm: {
    provider: LlmProvider;
    model: string;
    openaiApiKey?: string;
    openaiBaseUrl?: string;
    anthropicApiKey?: string;
  };
};

function parseEnv(): z.infer<typeof envSchema> {
  return envSchema.parse({
    DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
    DAYTONA_API_URL: process.env.DAYTONA_API_URL,
    DAYTONA_TARGET: process.env.DAYTONA_TARGET,
    DAYTONA_MODE: process.env.DAYTONA_MODE ?? "cloud",
    LLM_PROVIDER: process.env.LLM_PROVIDER ?? "openai",
    LLM_MODEL: process.env.LLM_MODEL ?? "gpt-4o-mini",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  });
}

/** Load config from environment (.env supported via dotenv). */
export function loadConfig(): AppConfig {
  const env = parseEnv();

  if (!env.DAYTONA_API_KEY) {
    throw new Error(
      "DAYTONA_API_KEY is required. Create a key at https://app.daytona.io/dashboard/keys",
    );
  }

  if (env.DAYTONA_MODE === "self-hosted" && !env.DAYTONA_API_URL) {
    throw new Error(
      "DAYTONA_MODE=self-hosted requires DAYTONA_API_URL (your Daytona API endpoint).",
    );
  }

  if (env.LLM_PROVIDER === "openai" && !env.OPENAI_API_KEY) {
    throw new Error(
      "LLM_PROVIDER=openai requires OPENAI_API_KEY (any OpenAI-compatible API also works with OPENAI_BASE_URL).",
    );
  }

  if (env.LLM_PROVIDER === "anthropic" && !env.ANTHROPIC_API_KEY) {
    throw new Error("LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY.");
  }

  return {
    daytona: {
      mode: env.DAYTONA_MODE,
      apiKey: env.DAYTONA_API_KEY,
      apiUrl:
        env.DAYTONA_MODE === "self-hosted"
          ? env.DAYTONA_API_URL
          : env.DAYTONA_API_URL,
      target: env.DAYTONA_TARGET,
    },
    llm: {
      provider: env.LLM_PROVIDER,
      model: env.LLM_MODEL,
      openaiApiKey: env.OPENAI_API_KEY,
      openaiBaseUrl: env.OPENAI_BASE_URL,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
    },
  };
}
