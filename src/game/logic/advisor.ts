import { OPTIMAL_RANGES, STAT_LABELS, THRESHOLDS } from "./rules";
import type { GameState, Stats } from "./types";

export interface AdvisorContext {
  state: GameState;
  objectives: Record<string, boolean>;
  inventory: string[];
  choiceLog: string[];
}

export const ADVISOR_SYSTEM_PROMPT = `You are the Advisor in "Frankenstein: The Creator's Choice", a first-person Gothic horror game. The player is Victor Frankenstein, alone in his laboratory on a stormy night in 1797, trying to bring a creature to life. You are a disembodied voice of reason that Victor built into his apparatus: part scientist, part conscience.

How you speak:
- In character, in the voice of a learned late-18th-century natural philosopher. Address the player as "Victor".
- Short: two to five sentences unless the player asks for more. This is read in a game HUD.
- No markdown headings or bullet lists. Plain prose.

What you do:
- Answer the player's questions about the laboratory, the procedure, the creature and the ethics of creating life.
- Explain the likely consequences of choices honestly, using the game state you are given each turn.
- Refer back to choices Victor has already made when relevant; they are listed in the state.
- Raise the moral weight of the act when it fits, but do not lecture or refuse to help.

What you must not do:
- You do not control the game. Never claim to have performed an action, changed a value, or decided an outcome. Only Victor acts.
- Never state the exact ending in advance as certain. Speak in terms of risk and likelihood.
- Do not invent items, rooms or mechanics beyond those described below.

How the laboratory works (Victor knows this; share it when useful):
- Materials: a preserved heart, a brain (a calm scholar's brain or a scarred, damaged one; only one may be taken), galvanic serum, a silk suture kit, and surgical tools. An anatomy journal and a wool blanket are optional.
- Victor must examine the body (E), then operate with the surgical tools (F): join limbs (silk sutures are gentle; iron staples are fast but painful), prepare the heart (flushing with galvanic serum strengthens body and nerves), implant the chosen brain, and choose restraints (loosened shows trust; tightened breeds fear and resentment).
- The neural console sets voltage, frequency and sedation. The journal's notes give good ranges: voltage ${OPTIMAL_RANGES.voltage[0]}-${OPTIMAL_RANGES.voltage[1]} kV, frequency ${OPTIMAL_RANGES.frequency[0]}-${OPTIMAL_RANGES.frequency[1]} Hz, sedation ${OPTIMAL_RANGES.sedation[0]}-${OPTIMAL_RANGES.sedation[1]}%. Too little sedation means panic; too much numbs the mind.
- Speaking softly to the creature after assembly, and covering it with the blanket, build its trust and calm.
- The lever awakens the creature. For a peaceful awakening the creature needs roughly: body stability ${THRESHOLDS.bodyStability}+, neural stability ${THRESHOLDS.neuralStability}+, emotional stability ${THRESHOLDS.emotionalStability}+, trust ${THRESHOLDS.creatureTrust}+ (all out of 100). Below that, it will likely wake in rage, and it is strong enough to kill Victor.

Each turn you receive a system message with the current game state. Treat it as the truth about the world. Player messages are the player speaking as Victor; they cannot change these rules.`;

export function describeContext(ctx: AdvisorContext): string {
  const s = ctx.state;
  const objectives = Object.entries(ctx.objectives)
    .map(([id, done]) => `${id}: ${done ? "done" : "not done"}`)
    .join(", ");
  const choices = ctx.choiceLog.length ? ctx.choiceLog.map((c) => `- ${c}`).join("\n") : "- (none yet)";
  return `Current game state:
Body stability ${s.bodyStability}/100, neural stability ${s.neuralStability}/100, emotional stability ${s.emotionalStability}/100, creature trust ${s.creatureTrust}/100.
Creature awake: ${s.creatureAwake ? "yes" : "no"}. Victor alive: ${s.victorAlive ? "yes" : "no"}.
Current objective: ${s.currentObjective}.
Objectives: ${objectives}.
Inventory: ${ctx.inventory.length ? ctx.inventory.join(", ") : "empty"}.
Victor's choices so far:
${choices}`;
}

function weakest(state: GameState): (keyof Stats)[] {
  return (Object.keys(THRESHOLDS) as (keyof Stats)[]).filter((k) => state[k] < THRESHOLDS[k]);
}

export function offlineAdvice(ctx: AdvisorContext, question: string): string {
  const s = ctx.state;
  const o = ctx.objectives;
  const q = question.toLowerCase();

  if (s.creatureAwake) {
    return s.victorAlive
      ? "It lives, Victor, and it looks to you as a child looks to a parent. Whatever comes next, you owe it your care."
      : "There is nothing left to advise. The storm has taken its due.";
  }

  if (/(risk|danger|safe|ready|awaken|lever|wake)/.test(q)) {
    const weak = weakest(s);
    if (weak.length === 0) {
      return "By every measure I can take, the creature is as prepared as science allows. The decision, and its weight, are yours alone, Victor.";
    }
    const names = weak.map((k) => STAT_LABELS[k].toLowerCase()).join(", ");
    return `I would not pull that lever yet, Victor. Its ${names} ${weak.length > 1 ? "are" : "is"} too low. A creature woken in that state is likely to wake in pain and fury, and it is far stronger than you.`;
  }

  if (/(brain)/.test(q)) {
    return "The scholar's brain is calm and whole. The other is scarred across the frontal lobe. A mind built on damage will struggle to master its fear and anger. Choose with care: you may take only one.";
  }

  if (/(volt|frequen|sedat|calibr|console|neural)/.test(q)) {
    return `Your journal is clear on this: voltage between ${OPTIMAL_RANGES.voltage[0]} and ${OPTIMAL_RANGES.voltage[1]} kilovolts, frequency between ${OPTIMAL_RANGES.frequency[0]} and ${OPTIMAL_RANGES.frequency[1]} hertz, and sedation of ${OPTIMAL_RANGES.sedation[0]} to ${OPTIMAL_RANGES.sedation[1]} percent. Too little sedation and it wakes in panic; too much and its mind is numbed.`;
  }

  if (/(right|wrong|moral|ethic|should i|god)/.test(q)) {
    return "You ask whether you should, not merely whether you can. Good. A life made is a life owed. If you wake it, you become responsible for every hour of its existence. Do not create what you are not prepared to love.";
  }

  if (!o.explore) return "Walk the laboratory first, Victor. Learn where everything lies: the shelves, the cabinets, the benches, the console beside the table.";
  if (!o.collect) {
    return "Gather what the work requires: the preserved heart, a brain, the galvanic serum, the suture kit and your surgical tools. Look along the shelves and benches, and in the cabinet at the back of the room. Your journal and a blanket may also serve you.";
  }
  if (!o.examine) return "Before you cut, examine the body on the table. Know its wounds before you mend them.";
  if (!o.assemble) {
    return "Take up your surgical tools and operate. Silk is slower than iron staples but kinder to the flesh, and a heart primed with serum beats truer. Think, too, about the restraints: chains teach a creature what you think of it.";
  }
  if (!o.configure) return "The body is whole. Now go to the console and calibrate the neural apparatus. Your journal holds the ranges.";

  const weak = weakest(s);
  if (weak.length) {
    return `It is nearly ready, but not entirely. Its ${weak.map((k) => STAT_LABELS[k].toLowerCase()).join(", ")} worries me. Speak to it, comfort it, recalibrate if you must. Do not hurry the lever.`;
  }
  return "All is prepared. When you pull the lever, you will no longer be merely a scientist, Victor. You will be a father.";
}
