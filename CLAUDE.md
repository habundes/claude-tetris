# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step. Open `index.html` directly in a browser, or serve with any static server:

```sh
python3 -m http.server 8000
# or
npx serve .
```

There is no `package.json`, no bundler, no transpiler, and no test suite.

## Architecture

Four files, zero dependencies:

- **`index.html`** — entry point; two `<canvas>` elements (`#board` 300×600, `#next-canvas` 120×120) + sidebar panel + overlay for PAUSE/GAME OVER
- **`style.css`** — dark retro theme, flexbox layout; overlay uses `position:absolute; inset:0` over `.wrapper`
- **`game.js`** — all game logic (~305 lines, `'use strict'`, no modules)

### `game.js` layout

**Top constants** (lines 3–29): `COLS=10`, `ROWS=20`, `BLOCK=30`; `COLORS[1..7]`; `PIECES` shape matrices (color index embedded in each cell); `LINE_SCORES`.

**Global mutable state** (line 43): `board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `lastTime`, `dropAccum`, `dropInterval`, `animId`.

**Key functions:**
| Function | Purpose |
|---|---|
| `collide(shape, ox, oy)` | Bounds + overlap check |
| `tryRotate()` | CW rotation with 5 wall-kick offsets `[0,-1,1,-2,2]` |
| `clearLines()` | Sweeps full rows, updates score/level/`dropInterval` |
| `ghostY()` | Projects piece to landing row for ghost rendering |
| `hardDrop()` | Teleports to `ghostY()`, +2 pts/row |
| `lockPiece()` | `merge()` → `clearLines()` → `spawn()` |
| `loop(ts)` | RAF callback; accumulates `dropAccum`, calls `draw()` every frame |
| `init()` | Full state reset, starts RAF loop |

**Speed formula:** `dropInterval = Math.max(100, 1000 - (level-1) * 90)` ms (floor at level 11).

**Input:** single `keydown` listener — `P` pause, arrows move/rotate/soft-drop, `Space` hard drop.

**Game loop flow:** `init()` → `requestAnimationFrame(loop)` → piece falls every `dropInterval` ms → `lockPiece()` on collision → `spawn()` → `endGame()` if new piece collides immediately.
