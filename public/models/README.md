# 3D models

Put the downloaded Sketchfab `.glb` files here with these exact names:

| File | Source |
|---|---|
| `frankenstein.glb` | Included. "Frankenstein S Monster" by ennana (https://sketchfab.com/3d-models/frankenstein-s-monster-0e8d66cb3d4b486b9172f320f70b520f), CC BY 4.0 |
| `player-hands.glb` | Included but switched off (`enabled: false` in `src/game/config/assets.ts`). "hands animation" by hugo colauto (https://sketchfab.com/3d-models/hands-animation-9f63e924253b4179adb79b117a26d385), Sketchfab Standard licence |
| `laboratory/` | Optional extra lab props |

Until a file is present the game draws a procedural stand-in, so it runs either way.
Models are auto-scaled. The creature is laid on the table and animated through its skeleton (Unreal-mannequin bone names such as `pelvis`, `spine_01`, `upperarm_l`, `neck_01`, `head`), so a replacement creature should use the same rig. The hands use the same idea: `src/game/scene/handsRig.ts` takes the light-skinned right hand from the file, mirrors it for the left, and blends between the open hand (2 s into the take) and the fist (8 s) when you interact. If a model appears rotated or offset, adjust its entry in `src/game/config/assets.ts`.
Check each model's Sketchfab licence (often CC BY) and add the credit it requires to the README.
