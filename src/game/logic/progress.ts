import { EXPLORE_DISTANCE, OBJECTIVES, REQUIRED_MATERIALS } from "./content";
import type { Choices, ItemId, ObjectiveId } from "./types";

export interface ProgressInput {
  choices: Choices;
  collected: ItemId[];
  distanceWalked: number;
  advisorAsked: boolean;
  creatureAwake: boolean;
}

export function materialsCollected(collected: ItemId[]): number {
  return REQUIRED_MATERIALS.filter((group) => group.some((id) => collected.includes(id))).length;
}

export function hasAllMaterials(collected: ItemId[]): boolean {
  return materialsCollected(collected) === REQUIRED_MATERIALS.length;
}

export function isAssembled(c: Choices): boolean {
  return c.limbs !== null && c.heartPrep !== null && c.brain !== null && c.restraints !== null;
}

export function objectiveStatus(p: ProgressInput): Record<ObjectiveId, boolean> {
  return {
    explore: p.distanceWalked >= EXPLORE_DISTANCE,
    collect: hasAllMaterials(p.collected),
    examine: p.choices.examined,
    assemble: isAssembled(p.choices),
    configure: p.choices.calibration !== null,
    advisor: p.advisorAsked,
    awaken: p.creatureAwake,
  };
}

export function currentObjective(p: ProgressInput): string {
  const status = objectiveStatus(p);
  const next = OBJECTIVES.find((o) => o.id !== "advisor" && !status[o.id]);
  return next ? next.label : "The experiment is over";
}
