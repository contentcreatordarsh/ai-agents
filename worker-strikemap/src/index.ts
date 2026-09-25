export interface Env {
  ASSETS: Fetcher;
  VOTES: KVNamespace;
  ORIGIN_HOST: string;
}

/** Paths served from AWS EC2 (~5%): assignment + heavy/origin-only endpoints */
const EC2_PATH_PREFIXES = ["/debug/", "/ec2/"];

function isEc2Path(pathname: string): boolean {
  return EC2_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

async function proxyToEc2(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  url.hostname = env.ORIGIN_HOST;
  url.protocol = "http:";
  const headers = new Headers(request.headers);
  headers.set("Host", "strikemap.space");
  headers.set("X-StrikeMap-Gateway", "cloudflare-worker");
  return fetch(
    new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    }),
  );
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function getVotes(env: Env): Promise<Record<string, number>> {
  const raw = await env.VOTES.get("tally");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

async function setVotes(env: Env, votes: Record<string, number>): Promise<void> {
  await env.VOTES.put("tally", JSON.stringify(votes));
}

async function validCalloutIds(request: Request, env: Env): Promise<Set<string>> {
  const mapsUrl = new URL("/maps.json", request.url);
  const res = await env.ASSETS.fetch(mapsUrl.toString());
  const data = (await res.json()) as { maps: { callouts: { id: string }[] }[] };
  const ids = new Set<string>();
  for (const m of data.maps) {
    for (const c of m.callouts) ids.add(c.id);
  }
  return ids;
}

async function handleApi(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/geo") {
    const cf = (request as Request & { cf?: { country?: string; colo?: string } }).cf;
    return json({
      country: cf?.country?.toUpperCase() ?? null,
      colo: cf?.colo ?? null,
      source: "cloudflare-worker-edge",
    });
  }

  if (pathname === "/api/maps") {
    return env.ASSETS.fetch(new URL("/maps.json", request.url).toString());
  }

  if (pathname === "/api/votes" && request.method === "GET") {
    return json({ votes: await getVotes(env) });
  }

  if (pathname === "/api/vote" && request.method === "POST") {
    const payload = (await request.json().catch(() => null)) as { calloutId?: string } | null;
    const calloutId = payload?.calloutId;
    if (!calloutId) return json({ error: "calloutId required" }, 400);
    if (!(await validCalloutIds(request, env)).has(calloutId)) {
      return json({ error: "unknown callout" }, 400);
    }
    const votes = await getVotes(env);
    votes[calloutId] = (votes[calloutId] ?? 0) + 1;
    await setVotes(env, votes);
    return json({ ok: true, calloutId, votes });
  }

  return json({ error: "not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (isEc2Path(pathname)) {
      return proxyToEc2(request, env);
    }

    if (pathname.startsWith("/api/")) {
      return handleApi(request, env, pathname);
    }

    if (pathname === "/health/worker") {
      return json({ ok: true, tier: "cloudflare-worker", pct: 95 });
    }

    if (pathname === "/health/ec2") {
      const res = await proxyToEc2(new Request(new URL("/debug/headers", url), request), env);
      return json({
        ok: res.ok,
        tier: "aws-ec2",
        pct: 5,
        originStatus: res.status,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
