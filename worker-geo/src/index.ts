export default {
  async fetch(request: Request): Promise<Response> {
    const cf = (request as Request & { cf?: { country?: string; colo?: string } }).cf;
    const country = cf?.country?.toUpperCase() ?? null;
    const colo = cf?.colo ?? null;
    const body = JSON.stringify({
      country,
      colo,
      source: "cloudflare-worker-edge",
    });
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  },
};
