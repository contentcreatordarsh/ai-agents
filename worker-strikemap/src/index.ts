/**
 * Canonical StrikeMap Worker: City Battle (/api/v1, /ws/v1) + legacy intel map edge APIs.
 * Game logic lives in `strikemap-platform/` and is bundled from here.
 */
import gameWorker from "../../strikemap-platform/src/index";
import type { Env as GameEnv } from "../../strikemap-platform/src/env";
import { handleGatewayRequest, type GatewayEnv } from "./gateway";

export { StrikeGameDO } from "../../strikemap-platform/src/durable-objects/StrikeGame";

export type Env = GameEnv & GatewayEnv;

function isGameRequest(pathname: string): boolean {
  return (
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/ws/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/games") ||
    pathname.startsWith("/api/leaderboard") ||
    pathname === "/api/health"
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    const joinMatch = pathname.match(/^\/join\/([A-Za-z0-9]{4,8})\/?$/);
    if (joinMatch) {
      return Response.redirect(`${url.origin}/join/?code=${joinMatch[1].toUpperCase()}`, 302);
    }

    if (isGameRequest(pathname)) {
      return gameWorker.fetch(request, env, ctx);
    }

    const legacy = await handleGatewayRequest(request, env);
    if (legacy) return legacy;

    return env.ASSETS.fetch(request);
  },
  queue: gameWorker.queue,
};
