import type { D1Database } from "@cloudflare/workers-types";
import { newId } from "./ids";

const SESSION_DAYS = 14;

async function pbkdf2(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt);
  const hash = new Uint8Array(bits);
  return `pbkdf2:${[...salt].map((b) => b.toString(16).padStart(2, "0")).join("")}:${[...hash].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split(":");
  if (algo !== "pbkdf2") return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const expected = new Uint8Array(hashHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const bits = await pbkdf2(password, salt);
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export async function createSession(db: D1Database, userId: string): Promise<string> {
  const id = newId("sess");
  const now = Date.now();
  const expires = now + SESSION_DAYS * 86400_000;
  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, userId, expires, now)
    .run();
  return id;
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  level: number;
  totalXp: number;
};

export async function getSessionUser(db: D1Database, sessionId: string): Promise<SessionUser | null> {
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.username, p.display_name, p.level, p.total_xp
       FROM sessions s JOIN users u ON u.id = s.user_id
       JOIN profiles p ON p.user_id = u.id
       WHERE s.id = ? AND s.expires_at > ? AND u.deleted_at IS NULL`,
    )
    .bind(sessionId, Date.now())
    .first<{
      id: string;
      email: string;
      username: string;
      display_name: string;
      level: number;
      total_xp: number;
    }>();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    level: row.level,
    totalXp: row.total_xp,
  };
}

export function sessionCookie(sessionId: string, secure: boolean): string {
  const maxAge = SESSION_DAYS * 86400;
  const parts = [
    `sm_session=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)sm_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function resolveSessionToken(cookieHeader: string | null, authHeader: string | null): string | null {
  return parseBearerToken(authHeader) ?? parseSessionCookie(cookieHeader);
}
