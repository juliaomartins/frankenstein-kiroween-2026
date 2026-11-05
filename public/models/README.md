# 3D models

Put the downloaded Sketchfab `.glb` files here with these exact names:

| File | Source |
|---|---|
| `frankenstein.glb` | Included. "Frankenstein S Monster" by ennana (https://sketchfab.com/3d-models/frankenstein-s-monster-0e8d66cb3d4b486b9172f320f70b520f), CC BY 4.0 |
| `player-hands.glb` | First-person hands: https://skfb.ly/DuFB |
| `laboratory/` | Optional extra lab props |

Until a file is present the game draws a procedural stand-in, so it runs either way.
Models are auto-scaled. The creature is laid on the table and animated through its skeleton (Unreal-mannequin bone names such as `pelvis`, `spine_01`, `upperarm_l`, `neck_01`, `head`), so a replacement creature should use the same rig. If a model appears rotated or offset, adjust its entry in `src/game/config/assets.ts`.
Check each model's Sketchfab licence (often CC BY) and add the credit it requires to the README.
