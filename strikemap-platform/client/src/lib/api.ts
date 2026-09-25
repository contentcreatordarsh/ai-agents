const TOKEN_KEY = "sm_bearer_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; requestId: string } };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as ApiResult<T>;
  if (!res.ok || !data.ok) {
    const err = !data.ok ? data.error : { message: res.statusText };
    throw new Error(err?.message ?? "request_failed");
  }
  return data.data;
}
