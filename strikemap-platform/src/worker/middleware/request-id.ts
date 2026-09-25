import type { MiddlewareHandler } from "hono";
import { newId } from "../../lib/ids";

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const incoming = c.req.header("X-Request-ID");
  const id = incoming && incoming.length < 64 ? incoming : newId("req");
  c.set("requestId", id);
  await next();
  c.header("X-Request-ID", id);
};
