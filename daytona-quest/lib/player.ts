export function levelFromXp(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function xpToNextLevel(xp: number): { current: number; needed: number } {
  const level = levelFromXp(xp);
  const floor = (level - 1) * 200;
  const next = level * 200;
  return { current: xp - floor, needed: next - floor };
}
