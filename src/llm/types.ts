export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export interface LlmClient {
  complete(messages: ChatMessage[]): Promise<string>;
}
