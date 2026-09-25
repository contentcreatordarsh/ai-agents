import { Hono } from "hono";
import type { Env } from "../../env";
import {
  createSession,
  getSessionUser,
  hashPassword,
  parseSessionCookie,
  sessionCookie,
  verifyPassword,
} from "../../lib/auth";
import { newId } from "../../lib/ids";

export const authRoutes = new Hono<{ Bindings: Env }>();

async function verifyTurnstile(token: string | undefined, env: Env, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success?: boolean };
  return !!data.success;
}

authRoutes.post("/signup", async (c) => {
  const body = await c.req.json<{ email: string; username: string; password: string; turnstileToken?: string }>();
  const ip = c.req.header("CF-Connecting-IP") ?? "";
  if (!(await verifyTurnstile(body.turnstileToken, c.env, ip))) {
    return c.json({ error: "turnstile_failed" }, 403);
  }
  if (!body.email?.includes("@") || body.username?.length < 3 || body.password?.length < 8) {
    return c.json({ error: "invalid_input" }, 400);
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
    return c.json({ error: "email_or_username_taken" }, 409);
  }
  const sessionId = await createSession(c.env.DB, userId);
  const secure = c.env.ENVIRONMENT === "production";
  return c.json({ ok: true, userId }, 201, { "Set-Cookie": sessionCookie(sessionId, secure) });
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const row = await c.env.DB.prepare(
    "SELECT id, password_hash FROM users WHERE email = ? AND deleted_at IS NULL",
  )
    .bind(body.email?.toLowerCase())
    .first<{ id: string; password_hash: string }>();
  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    return c.json({ error: "invalid_credentials" }, 401);
  }
  const sessionId = await createSession(c.env.DB, row.id);
  const secure = c.env.ENVIRONMENT === "production";
  return c.json({ ok: true }, 200, { "Set-Cookie": sessionCookie(sessionId, secure) });
});

authRoutes.post("/logout", async (c) => {
  const sid = parseSessionCookie(c.req.header("Cookie") ?? null);
  if (sid) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  }
  return c.json({ ok: true }, 200, {
    "Set-Cookie": "sm_session=; Path=/; HttpOnly; Max-Age=0",
  });
});

authRoutes.get("/me", async (c) => {
  const sid = parseSessionCookie(c.req.header("Cookie") ?? null);
  if (!sid) return c.json({ user: null });
  const user = await getSessionUser(c.env.DB, sid);
  return c.json({ user });
});

export async function requireUser(c: { env: Env; req: { header: (n: string) => string | undefined } }) {
  const sid = parseSessionCookie(c.req.header("Cookie") ?? null);
  if (!sid) return null;
  return getSessionUser(c.env.DB, sid);
}
