# StrikeMap art direction (Phase A)

## Feeling
Tactical · geographic · competitive · cinematic · premium — not neon gamer or purple AI SaaS.

## Palette
| Token | Hex | Use |
|-------|-----|-----|
| Void | `#05070A` | Base |
| Deck | `#080D12` | Panels |
| Signal | `#00F5D4` | Primary UI, map grid |
| Alliance | `#168CFF` | BLUE team |
| Hostile | `#FF315D` | RED team |
| Pulse | `#FF178B` | Alerts, contested |
| Ink | `#EDF5FF` | Type |

## Typography
- **Display:** Barlow Condensed — environment-scale headlines (clamp 4rem–12rem).
- **UI:** Space Grotesk — body, HUD, metadata (10–14px tracked labels).

## Motion
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances; linear for radar/scan.
- Scroll drives **camera** on the world map, not just section fades.
- Respect `prefers-reduced-motion`: disable pin/scrub, use instant cuts.

## Map language
Dark Carto basemap, cyan grid overlay, team-colored sectors, pulsing capture rings, player blips.
