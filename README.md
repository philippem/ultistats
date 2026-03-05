# UltiStats

A progressive web app for tracking ultimate frisbee stats on the sideline, built for iPad.

## Features

- **Roster management** — create your team once, players persist across games
- **Live game tracking** — tap a player, tap an action; designed for speed on a touchscreen
- **O/D mode** — set the starting side each point; possession flips automatically on turnovers with a visual background tint (blue = offense, orange = defense)
- **Lineup tracking** — select who's on the field each point to track O/D points per player
- **Implicit catches** — selecting a new player on offense auto-logs a catch before a pass, goal, or throwaway
- **Stats page** — per-player aggregate stats across all games, plus a game-by-game breakdown per player
- **In-game stats** — view current game stats mid-game without losing your place
- **Offline capable** — installable as a PWA; works without internet once loaded

## Tracked stats

| Stat | Description |
|------|-------------|
| GP | Games played |
| O Pts | Points started on offense |
| D Pts | Points started on defense |
| Pass | Completions thrown |
| Catch | Completions received |
| Drop% | Drops / (catches + drops) |
| Blk | Hand blocks + interceptions + layout Ds |
| Goal | Goals scored |
| Ast | Assists |
| Away | Throwaways |
| UT | Unforced turnovers |

## Install on iPad

Open `https://philippem.github.io/ultistats/` in Safari, then tap **Share → Add to Home Screen**.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (vitest)
npm run test:e2e   # E2E tests (playwright)
```

Deploys automatically to GitHub Pages on push to `main`.

## Stack

- React + TypeScript + Vite
- PWA via vite-plugin-pwa
- Data stored in localStorage (no backend yet)
- Hosted on GitHub Pages
