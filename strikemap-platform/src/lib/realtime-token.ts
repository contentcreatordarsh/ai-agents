import type { KVNamespace } from "@cloudflare/workers-types";
import { newId } from "./ids";

const TTL_SEC = 60;

export type RealtimeTicket = {
  gameId: string;
  userId: string;
  username: string;
  team: string;
  demo: boolean;
};

export async function issueRealtimeToken(kv: KVNamespace, ticket: RealtimeTicket): Promise<string> {
  const token = newId("rt");
  await kv.put(`rt:${token}`, JSON.stringify(ticket), { expirationTtl: TTL_SEC });
  return token;
}

export async function consumeRealtimeToken(kv: KVNamespace, token: string): Promise<RealtimeTicket | null> {
  const raw = await kv.get(`rt:${token}`);
  if (!raw) return null;
  await kv.delete(`rt:${token}`);
  return JSON.parse(raw) as RealtimeTicket;
}
