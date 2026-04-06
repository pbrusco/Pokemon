# My Pokemon — Documentation Index

A Pokemon Fire Red-style RPG built with React 19, TypeScript, Vite, Tailwind CSS, and Zustand.

## Quick Start

```bash
npm run dev       # Dev server on http://localhost:3000
npm run build     # Production build to dist/
npm run lint      # TypeScript type-check (tsc --noEmit)
npm run preview   # Preview production build
```

> **Note:** Node.js lives at `/opt/homebrew/bin/node`. Prepend `export PATH="/opt/homebrew/bin:$PATH"` if needed.

---

## Documentation

| File | Audience | Description |
|------|----------|-------------|
| [gameplay.md](./gameplay.md) | Players | How to play, controls, story progression |
| [architecture.md](./architecture.md) | Devs / AI agents | File map, key patterns, tech decisions |
| [state-and-fsm.md](./state-and-fsm.md) | Devs / AI agents | Zustand store + Game Phase FSM |
| [game-mechanics.md](./game-mechanics.md) | Devs / AI agents | Battle system, damage formula, catch rates |
| [game-data.md](./game-data.md) | Devs / AI agents | Pokemon, moves, maps, items data reference |
| [components.md](./components.md) | Devs / AI agents | UI component API reference |
| [adding-content.md](./adding-content.md) | Devs / AI agents | How to add maps, NPCs, Pokemon, moves |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Animations | Framer Motion (`motion`) |
| Audio SFX | Web Audio API (synthesized) |
| Audio BGM | Howler.js (streamed) |
| Icons | Lucide React |

---

## Project at a Glance

- **10 maps** — Pallet Town through Route 3 / Pewter Gym
- **151 Pokemon** — Full Gen I base stats
- **Turn-based battles** — Authentic Gen I damage formula with STAB, type effectiveness, critical hits
- **Fully in Spanish** — All in-game text, move names, and dialogue
- **Persistent save** — Auto-saves to `localStorage` every 30 seconds
- **Mobile-friendly** — On-screen joystick for touch devices
