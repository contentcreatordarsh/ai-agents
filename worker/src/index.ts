export interface Env {
  FLAGS: R2Bucket;
  PUBLIC_HOST: string;
}

const SECURE_PREFIX = "/secure";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function authenticatedEmail(request: Request): string | null {
  return (
    request.headers.get("Cf-Access-Authenticated-User-Email") ??
    request.headers.get("cf-access-authenticated-user-email")
  );
}

function countryCode(request: Request): string {
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const code = cf?.country?.toUpperCase();
  if (code && /^[A-Z]{2}$/.test(code)) {
    return code;
  }
  return "XX";
}

function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

async function serveFlag(env: Env, code: string): Promise<Response> {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return new Response("Invalid country code", { status: 400 });
  }

  const object = await env.FLAGS.get(`${normalized}.svg`);
  if (!object) {
    return new Response("Flag not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "image/svg+xml");
  headers.set("Cache-Control", "private, max-age=3600");

  return new Response(object.body, { status: 200, headers });
}

function secureHtmlPage(
  env: Env,
  email: string,
  timestamp: string,
  country: string,
): string {
  const host = env.PUBLIC_HOST.replace(/\/$/, "");
  const countryUrl = `https://${host}${SECURE_PREFIX}/${country}`;
  const countryLink = `<a href="${escapeHtml(countryUrl)}">${escapeHtml(country)}</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>StrikeMap Live Ops</title>
  <style>
    :root { --bg:#0b0f14; --panel:#121a24; --border:#243044; --accent:#ff4655; --text:#e8eef7; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; min-height: 100vh; }
    main { max-width: 42rem; margin: 0 auto; padding: 2.5rem 1rem; }
    .card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem 1.5rem; }
    h1 { margin: 0 0 0.5rem; font-size: 1.1rem; letter-spacing: 0.06em; }
    p { line-height: 1.55; margin: 0; }
    a { color: #9ec5ff; }
    .badge { display:inline-block; margin-top:1rem; font-size:.75rem; color:#8fa3bf; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>STRIKEMAP LIVE OPS</h1>
      <p>${escapeHtml(email)} authenticated at ${escapeHtml(timestamp)} from ${countryLink}</p>
      <span class="badge">Zero Trust · Worker · private R2 flags</span>
    </div>
  </main>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith(SECURE_PREFIX)) {
      return notFound();
    }

    const email = authenticatedEmail(request);
    if (!email) {
      return unauthorized();
    }

    const remainder = path.slice(SECURE_PREFIX.length);
    if (remainder === "" || remainder === "/") {
      const timestamp = new Date().toISOString();
      const country = countryCode(request);
      const html = secureHtmlPage(env, email, timestamp, country);
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const match = remainder.match(/^\/([A-Za-z]{2})$/);
    if (match) {
      return serveFlag(env, match[1]);
    }

    return notFound();
  },
};
