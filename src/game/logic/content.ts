import type { ItemId, ObjectiveId } from "./types";

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  required: boolean;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  heart: {
    id: "heart",
    name: "Preserved Heart",
    description: "A strong heart kept in brine. It still twitches when the storm flashes.",
    required: true,
  },
  brain_scholar: {
    id: "brain_scholar",
    name: "Brain of a Scholar",
    description: "Labelled in a careful hand: 'Prof. H. W., natural philosopher. Calm temperament.'",
    required: true,
  },
  brain_damaged: {
    id: "brain_damaged",
    name: "Damaged Brain",
    description: "Discoloured tissue, a deep scar across the frontal lobe. The label is smudged.",
    required: true,
  },
  galvanic_serum: {
    id: "galvanic_serum",
    name: "Galvanic Serum",
    description: "Glowing green conductive fluid. Primes living tissue to carry current.",
    required: true,
  },
  suture_kit: {
    id: "suture_kit",
    name: "Suture Kit",
    description: "Fine silk thread and curved needles. Slow work, but gentle on the flesh.",
    required: true,
  },
  surgical_tools: {
    id: "surgical_tools",
    name: "Surgical Tools",
    description: "Scalpels, clamps and forceps. Equip and press F on the body to operate.",
    required: true,
  },
  journal: {
    id: "journal",
    name: "Anatomy Journal",
    description: "Your own notes on galvanism, including the calibration ranges for the neural apparatus.",
    required: false,
  },
  blanket: {
    id: "blanket",
    name: "Wool Blanket",
    description: "Warm and worn. Something newly alive might find comfort in it.",
    required: false,
  },
};

export const REQUIRED_MATERIALS: ItemId[][] = [
  ["heart"],
  ["brain_scholar", "brain_damaged"],
  ["galvanic_serum"],
  ["suture_kit"],
  ["surgical_tools"],
];

export interface ObjectiveDef {
  id: ObjectiveId;
  label: string;
}

export const OBJECTIVES: ObjectiveDef[] = [
  { id: "explore", label: "Explore the laboratory" },
  { id: "collect", label: "Prepare the creation materials" },
  { id: "examine", label: "Examine the creature's body" },
  { id: "assemble", label: "Assemble the body" },
  { id: "configure", label: "Configure the neural system" },
  { id: "advisor", label: "Ask the AI Advisor for guidance" },
  { id: "awaken", label: "Decide whether to awaken the creature" },
];

export const EXPLORE_DISTANCE = 8;
