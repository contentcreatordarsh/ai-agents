export type BattleCard = {
  id: string;
  city: string;
  status: "LIVE" | "LOBBY";
  players: number;
  red: number;
  blue: number;
  capture: number;
  lng: number;
  lat: number;
  battleCode: string;
};

/** Demonstration values — not live server data. */
export const DEMO_BATTLES: BattleCard[] = [
  {
    id: "sg",
    city: "SINGAPORE",
    status: "LIVE",
    players: 18,
    red: 500,
    blue: 750,
    capture: 64,
    lng: 103.8198,
    lat: 1.3521,
    battleCode: "042",
  },
  {
    id: "tk",
    city: "TOKYO",
    status: "LIVE",
    players: 31,
    red: 1000,
    blue: 750,
    capture: 42,
    lng: 139.6917,
    lat: 35.6895,
    battleCode: "051",
  },
  {
    id: "ld",
    city: "LONDON",
    status: "LOBBY",
    players: 6,
    red: 0,
    blue: 0,
    capture: 0,
    lng: -0.1276,
    lat: 51.5074,
    battleCode: "018",
  },
];
