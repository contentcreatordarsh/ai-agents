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
  <title>Secure access</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; }
  </style>
</head>
<body>
  <p>${escapeHtml(email)} authenticated at ${escapeHtml(timestamp)} from ${countryLink}</p>
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
