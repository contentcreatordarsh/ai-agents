import type { Context } from "hono";
import type { ApiErrorCode } from "../../shared/contracts/errors";
import type { ApiFailure, ApiSuccess } from "../../shared/contracts/api";

export function requestId(c: Context): string {
  return c.get("requestId") as string;
}

export function apiOk<T>(c: Context, data: T, status = 200) {
  const body: ApiSuccess<T> = { ok: true, data };
  return c.json(body, status, {
    "X-Request-ID": requestId(c),
    "Content-Type": "application/json",
  });
}

export function apiErr(
  c: Context,
  code: ApiErrorCode,
  message: string,
  status = 400,
) {
  const body: ApiFailure = {
    ok: false,
    error: { code, message, requestId: requestId(c) },
  };
  return c.json(body, status, {
    "X-Request-ID": requestId(c),
    "Content-Type": "application/json",
  });
}
