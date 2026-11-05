# Installed agent skills

All skills live in `.claude/skills/` (project scope), so every Claude Code session in this repo picks them up, cloud sessions included.
Each pack is a snapshot of its source repo at the commit shown. To update a pack, re-copy its `skills/` folder, or for ai-dev-kit re-run its installer.

| Pack | Source | Commit | Skills |
|---|---|---|---|
| Superpowers | [obra/superpowers](https://github.com/obra/superpowers) (also listed in the official Claude plugin marketplace) | 22f0b46 | `brainstorming`, `diagnosing-superpowers`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills` |
| Three.js Awesome Graphics | [scottstts/Threejs-Awesome-Graphics-Agent-Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills) | 53eb5a2 | `threejs-atmosphere-aerial-perspective`, `threejs-bloom`, `threejs-camera-direction`, `threejs-exposure-color-grading`, `threejs-image-pipeline`, `threejs-parallax-occlusion-mapping`, `threejs-precipitation-surfaces`, `threejs-procedural-animation`, `threejs-procedural-architecture`, `threejs-procedural-fields`, `threejs-procedural-geometry`, `threejs-procedural-materials`, `threejs-procedural-planets`, `threejs-procedural-vegetation`, `threejs-procedural-vfx`, `threejs-raymarched-space-effects`, `threejs-screen-space-ambient-occlusion`, `threejs-shadow-systems`, `threejs-skill-router`, `threejs-spectral-ocean`, `threejs-temporal-surfaces`, `threejs-visual-validation`, `threejs-volumetric-clouds`, `threejs-water-optics` |
| AI Dev Kit | [AftabIbrahimKazi/ai-dev-kit](https://github.com/AftabIbrahimKazi/ai-dev-kit) | 32770e7 | Installed by its own `install-kit.cli.js` ("Everything" set, tracked in `.ai-dev-kit.json`), along with `coding-standards/`, `CLAUDE.md` and the slash commands in `.claude/commands/` |
| Nixie FX | [azakhary/nixie-fx](https://github.com/azakhary/nixie-fx) | b056d7e | `nixie-fx-authoring`, `nixie-fx-runtime` |
| Three.js Game Skills | [majidmanzarpour/threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) | 8286774 | `threejs-3d-generator`, `threejs-aaa-graphics-builder`, `threejs-audio-generator`, `threejs-debug-profiler`, `threejs-game-director`, `threejs-game-ui-designer`, `threejs-gameplay-systems`, `threejs-image-generator`, `threejs-qa-release` |
| WebGPU / TSL | [dgreenheck/webgpu-claude-skill](https://github.com/dgreenheck/webgpu-claude-skill) | af2319b | `webgpu-threejs-tsl` |

## Notes

- **Superpowers** is installed as plain project skills, not as a plugin, so its skills have no `superpowers:` prefix (`superpowers:brainstorming` is `brainstorming`). `.claude/hooks/superpowers-session-start.sh`, registered in `.claude/settings.json`, injects `using-superpowers` at session start the same way the plugin's own hook does.
- **AI Dev Kit** opt-in extras were left out: addons (narrate, personality, project-context, system1-prefilter), MCP servers, mods, misfire-log, the git hook, and the `hooks-enforcement` settings merge. The OpenCode-only `opencode-all-models` was skipped too. Ask to add any of them; the installer path is `node <ai-dev-kit>/skills/meta/install-kit.cli.js install --library <ai-dev-kit> --root . --tool claude --skills <names>`.
