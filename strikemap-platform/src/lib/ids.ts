const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex.slice(0, 16)}`;
}

export function publicGameId(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 90000 + 10000;
  return `SM-${n}`;
}

export function joinCode(length = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}
