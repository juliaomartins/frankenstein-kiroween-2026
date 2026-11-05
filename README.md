# Frankenstein: The Creator's Choice

A first-person Gothic horror game for the browser. You are Victor Frankenstein, alone in your laboratory on a stormy night. Gather the materials, assemble and calibrate the creature, consult your AI advisor, and decide whether to pull the lever. Careful, humane choices give a peaceful awakening; careless or cruel ones wake it in rage.

Built with Next.js (App Router), TypeScript, Three.js, React Three Fiber, Drei, Zustand, Tailwind CSS and the Claude API.

## Run it locally

Requirements: Node.js 20 or newer, a desktop browser with WebGL 2, mouse and keyboard.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Add your Anthropic API key to `.env.local` as `ANTHROPIC_API_KEY=...`. Without a key the advisor still works in an offline mode with scripted, state-aware advice.

```bash
npm run dev
```

Open http://localhost:3000 and click **Enter the laboratory**.

Other scripts: `npm test` (game-logic unit tests), `npm run typecheck`, `npm run build` then `npm start` (production).

## Controls

| Key | Action |
|---|---|
| Mouse | Look (click the scene to capture the mouse, Esc to release) |
| W A S D | Move (Shift to run) |
| E | Interact / take / examine |
| F | Use the equipped tool (operate on the body) |
| Tab | Inventory |
| C | AI Advisor |
| Esc | Close the open panel |

## How a playthrough goes

1. Explore the laboratory.
2. Collect the materials: the preserved heart (east shelves), a brain (the cabinet on the west wall; you may take only one), the galvanic serum (front table), and the suture kit and surgical tools (east bench). The anatomy journal (west bench) and the wool blanket (crate by the door) are optional.
3. Examine the body (E on the table).
4. Operate (F on the body): choose how to join the limbs, prepare the heart and set the restraints.
5. Calibrate the neural apparatus at the console beside the table.
6. Ask the AI Advisor for guidance (C).
7. Speak to the creature, cover it with the blanket, or not, then pull the lever.

## Architecture

```
src/
├── app/
│   ├── api/advisor/route.ts   Server route: streams advisor replies from Claude (key stays server-side)
│   ├── GameLoader.tsx         Client-only dynamic import of the game
│   └── page.tsx, layout.tsx, globals.css
└── game/
    ├── logic/                 Pure, deterministic game rules (unit tested)
    │   ├── rules.ts           Stats from choices, thresholds, ending calculation
    │   ├── progress.ts        Objective status
    │   ├── content.ts         Items and objectives
    │   └── advisor.ts         Advisor system prompt, state serialiser, offline fallback
    ├── state/gameStore.ts     Zustand store: inventory, choices, panels, advisor chat, interaction prompts
    ├── scene/                 React Three Fiber scene
    │   ├── Laboratory.tsx     Walls, vault, gothic windows, reflective wet floor
    │   ├── Machines.tsx       Operating table, electrode ring, Tesla coil, console and lever, furnace
    │   ├── Props.tsx          Benches, shelves, jars, candles, lanterns, collectible items
    │   ├── Creature.tsx       GLB creature (or procedural stand-in) and awakening animation
    │   ├── Hands.tsx          Camera-attached first-person hands with reach/use animations
    │   ├── Player.tsx         Pointer-lock look, WASD with collision, raycast interaction, ending camera
    │   ├── Storm.tsx          Lightning flashes, bolts, dust
    │   └── GameCanvas.tsx     Canvas, lights, bloom/vignette/noise post-processing
    ├── ui/                    Tailwind HUD, panels, advisor chat, title and ending screens
    ├── audio.ts               Procedural Web Audio: rain, hum, thunder, crackle, roar
    └── config/assets.ts       Model paths and orientation
```

### Deterministic endings

Stats are never accumulated; they are recomputed from the record of choices (`computeStats` in `src/game/logic/rules.ts`). The ending is good only if body ≥ 60, neural ≥ 60, emotional ≥ 55 and trust ≥ 50. The LLM never decides anything: it receives the current state as context and only produces dialogue.

### AI advisor

`POST /api/advisor` takes the chat history plus a snapshot of the game state, objectives, inventory and the log of choices so far, and streams plain text back. It uses `@anthropic-ai/sdk` with the model in `ADVISOR_MODEL` (default `claude-opus-5-5`), low effort for quick replies, and server-side refusal fallback. The game state is sent as a trailing system message so the static system prompt stays cacheable. If no key is configured or the call fails, the route answers with deterministic offline advice.

### 3D models

Drop `frankenstein.glb` and `player-hands.glb` into `public/models/` (see `public/models/README.md`). The game detects them at runtime and falls back to procedural stand-ins when they are missing.

### Performance notes

One shadow-casting spotlight, a fixed set of point lights (constant count, so shaders never recompile mid-game), instanced bottles and books, cached canvas textures, adaptive DPR and a performance monitor that drops bloom quality and MSAA on slow GPUs.
