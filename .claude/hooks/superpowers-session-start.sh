#!/usr/bin/env bash
# Injects the Superpowers `using-superpowers` skill at session start,
# mirroring the SessionStart hook shipped with the obra/superpowers plugin.
set -euo pipefail
skill_md="${CLAUDE_PROJECT_DIR:-.}/.claude/skills/using-superpowers/SKILL.md"
[ -r "$skill_md" ] || exit 0
exec node -e '
const fs = require("fs");
const body = fs.readFileSync(process.argv[1], "utf8").trimEnd();
const ctx = "<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your \x27using-superpowers\x27 skill - your introduction to using skills. For all other skills, use the \x27Skill\x27 tool. Superpowers skills are installed at project level without the `superpowers:` prefix (e.g. `superpowers:brainstorming` is the `brainstorming` skill).**\n\n" + body + "\n</EXTREMELY_IMPORTANT>";
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx } }));
' "$skill_md"
