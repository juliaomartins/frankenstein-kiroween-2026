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

Open http://localhost:3000 and click **Enter the Laboratory**. The title screen also has **Options** (volume, mouse sensitivity, graphics quality, saved in the browser) and **Credits**.

Other scripts: `npm test` (game-logic unit tests), `npm run typecheck`, `npm run build` then `npm start` (production).

## Controls

| Key | Action |
|---|---|
| Mouse | Look (click the scene to capture the mouse, Esc to release; if the browser blocks capture, drag to look) |
| Arrow keys | Turn and look up/down, usable together with W A S D |
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
    │   ├── creatureRig.ts     Skeleton posing: lying, sitting up, reaching, head turn
    │   ├── Hands.tsx          Camera-attached first-person hands with reach/use animations
    │   ├── handsRig.ts        Orients, mirrors and grip-blends the rigged hand model
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

The creature is `public/models/frankenstein.glb`. It is posed and animated through its skeleton (`src/game/scene/creatureRig.ts`): laid on its back with its arms at its sides, sitting up in the good ending, standing and reaching in the bad one. The first-person hands are `public/models/player-hands.glb`, oriented, mirrored for the left hand and grip-animated by `src/game/scene/handsRig.ts`.

## Credits

- First-person hands: ["hands animation"](https://sketchfab.com/3d-models/hands-animation-9f63e924253b4179adb79b117a26d385) by [hugo colauto](https://sketchfab.com/hugocolauto), Sketchfab Standard licence.
- Creature model: ["Frankenstein S Monster"](https://sketchfab.com/3d-models/frankenstein-s-monster-0e8d66cb3d4b486b9172f320f70b520f) by [ennana](https://sketchfab.com/samierh49), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

### Model loading

- `npm run optimize:models` (`scripts/optimize-models.mjs`, uses the `sharp` package that Next.js already installs) re-encodes textures as WebP and caps their size. It also strips the unused second hand from `player-hands.glb` and bakes its 21 s take down to the two poses the game uses (2 s and 8 s). The models went from 26.3 MB to 2.1 MB. Run it on the original Sketchfab downloads, since each run re-encodes the textures.
- Both models start downloading while the title screen is showing (`useGLTF.preload`), and the title screen shows their progress without blocking entry.
- Each model's shaders are compiled in the background (`renderer.compileAsync`) before it is shown, so it appears without a frame hitch. The creature keeps its procedural stand-in until the real model is ready.
- `/models/*` is served with a one-day cache.

### Performance notes

One shadow-casting spotlight, a fixed set of point lights (constant count, so shaders never recompile mid-game), instanced bottles and books, cached canvas textures, adaptive DPR and a performance monitor that drops bloom quality and MSAA on slow GPUs.
