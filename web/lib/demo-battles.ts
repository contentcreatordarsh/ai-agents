export type BattleCard = {
  id: string;
  city: string;
  status: "LIVE" | "LOBBY";
  players: number;
  red: number;
  blue: number;
  capture: number;
};

/** Demonstration values — not live server data. */
export const DEMO_BATTLES: BattleCard[] = [
  { id: "sg", city: "SINGAPORE", status: "LIVE", players: 18, red: 500, blue: 750, capture: 64 },
  { id: "tk", city: "TOKYO", status: "LIVE", players: 31, red: 1000, blue: 750, capture: 42 },
  { id: "ld", city: "LONDON", status: "LOBBY", players: 6, red: 0, blue: 0, capture: 0 },
];
