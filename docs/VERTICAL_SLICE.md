# Smallest vertical slice (City Battle)

End-to-end flow: **auth → create → lobby → join (2–8 players, RED/BLUE) → start → one territory (`sector_01`) → capture → score → 5 min timer → finish**.

## Scope

- **Worker:** `worker-strikemap` bundles `strikemap-platform` (`StrikeGameDO` with `verticalSlice: true`)
- **HTTP:** `POST /api/v1/games`, `join`, `GET` game, `POST start`, `GET state`
- **WS:** `/ws/v1/games/{gameId}` · `STRIKEMAP_GAME_V1`
- **UI:** `web/` — create, join, lobby, battle play, **SIMULATION** pad when GPS unavailable

## Acceptance test

1. Browser A: `/battle/create/` → create → lobby shows code.
2. Browser B: `/join/?code=XXXXX` → “YOU JOINED BLUE”.
3. Host: **START BATTLE** → countdown 3-2-1 → `GAME_STARTED`.
4. Move (GPS or SIMULATION pad) → `PLAYER_MOVED` on peer.
5. Enter sector → capture 10%/s → `TERRITORY_CAPTURED` + `SCORE_UPDATED` (+250).
6. After 5 minutes → `GAME_FINISHED` overlay.

## Reconnect

Close tab B, reopen `/battle/play/?id=…` — WebSocket receives `GAME_STATE` snapshot.

## Out of scope

Four teams, XP, objectives, supply drops, full API catalog — see milestone list in product spec.
