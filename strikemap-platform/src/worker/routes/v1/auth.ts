import { Hono } from "hono";
import type { Env } from "../../../env";
import { apiOk, apiErr } from "../../lib/api-response";
import {
  createSession,
  getSessionUser,
  hashPassword,
  resolveSessionToken,
  verifyPassword,
} from "../../../lib/auth";
import { newId } from "../../../lib/ids";
export const v1AuthRoutes = new Hono<{ Bindings: Env; Variables: { requestId: string } }>();

export async function requireUserV1(c: {
  env: Env;
  req: { header: (n: string) => string | undefined };
}) {
  const token = resolveSessionToken(c.req.header("Cookie") ?? null, c.req.header("Authorization") ?? null);
  if (!token) return null;
  return getSessionUser(c.env.DB, token);
}

v1AuthRoutes.post("/signup", async (c) => {
  const body = await c.req.json<{ email: string; username: string; password: string }>();
  if (!body.email?.includes("@") || body.username?.length < 3 || body.password?.length < 8) {
    return apiErr(c, "VALIDATION_ERROR", "Invalid signup fields", 400);
  }
  const userId = newId("user");
  const now = Date.now();
  const passwordHash = await hashPassword(body.password);
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        "INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      ).bind(userId, body.email.toLowerCase(), body.username, passwordHash, now),
      c.env.DB.prepare(
        "INSERT INTO profiles (user_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ).bind(userId, body.username, now, now),
      c.env.DB.prepare(
        "INSERT INTO player_stats (user_id, games_played, games_won, captures, assists, updated_at) VALUES (?, 0, 0, 0, 0, ?)",
      ).bind(userId, now),
    ]);
  } catch {
    return apiErr(c, "VALIDATION_ERROR", "Email or username taken", 409);
  }
  const sessionId = await createSession(c.env.DB, userId);
  return apiOk(c, { token: sessionId, tokenType: "Bearer" }, 201);
});

v1AuthRoutes.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const row = await c.env.DB.prepare(
    "SELECT id, password_hash FROM users WHERE email = ? AND deleted_at IS NULL",
  )
    .bind(body.email?.toLowerCase())
    .first<{ id: string; password_hash: string }>();
  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    return apiErr(c, "UNAUTHORIZED", "Invalid credentials", 401);
  }
  const sessionId = await createSession(c.env.DB, row.id);
  return apiOk(c, { token: sessionId, tokenType: "Bearer" });
});
