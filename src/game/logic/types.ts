export type ItemId =
  | "heart"
  | "brain_scholar"
  | "brain_damaged"
  | "galvanic_serum"
  | "suture_kit"
  | "surgical_tools"
  | "journal"
  | "blanket";

export type ObjectiveId =
  | "explore"
  | "collect"
  | "examine"
  | "assemble"
  | "configure"
  | "advisor"
  | "awaken";

export type LimbMethod = "silk" | "staples";
export type HeartPrep = "serum" | "direct";
export type BrainChoice = "scholar" | "damaged";
export type RestraintChoice = "loose" | "tight";

export interface Calibration {
  voltage: number;
  frequency: number;
  sedation: number;
}

export interface Choices {
  examined: boolean;
  journalRead: boolean;
  limbs: LimbMethod | null;
  heartPrep: HeartPrep | null;
  brain: BrainChoice | null;
  restraints: RestraintChoice | null;
  calibration: Calibration | null;
  spokeToCreature: boolean;
  blanketGiven: boolean;
}

export interface GameState {
  bodyStability: number;
  neuralStability: number;
  emotionalStability: number;
  creatureTrust: number;
  creatureAwake: boolean;
  victorAlive: boolean;
  currentObjective: string;
}

export interface Stats {
  bodyStability: number;
  neuralStability: number;
  emotionalStability: number;
  creatureTrust: number;
}

export type EndingKind = "good" | "bad";

export interface EndingResult {
  kind: EndingKind;
  failures: (keyof Stats)[];
}
