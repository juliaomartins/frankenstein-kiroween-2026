import type { Calibration, Choices, EndingResult, Stats } from "./types";

export const BASE_STATS: Stats = {
  bodyStability: 25,
  neuralStability: 10,
  emotionalStability: 35,
  creatureTrust: 20,
};

export const THRESHOLDS: Stats = {
  bodyStability: 60,
  neuralStability: 60,
  emotionalStability: 55,
  creatureTrust: 50,
};

export const OPTIMAL_RANGES: Record<keyof Calibration, [number, number]> = {
  voltage: [55, 70],
  frequency: [35, 50],
  sedation: [20, 40],
};

const FALLOFF = 25;

export const EMPTY_CHOICES: Choices = {
  examined: false,
  journalRead: false,
  limbs: null,
  heartPrep: null,
  brain: null,
  restraints: null,
  calibration: null,
  spokeToCreature: false,
  blanketGiven: false,
};

export function closeness(value: number, [min, max]: [number, number]): number {
  if (value >= min && value <= max) return 1;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 1 - distance / FALLOFF);
}

function clamp(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function sedationEffect(sedation: number): number {
  const [min, max] = OPTIMAL_RANGES.sedation;
  if (sedation >= min && sedation <= max) return 15;
  if (sedation > max) return -5;
  return -15;
}

export function computeStats(c: Choices): Stats {
  let body = BASE_STATS.bodyStability;
  let neural = BASE_STATS.neuralStability;
  let emotional = BASE_STATS.emotionalStability;
  let trust = BASE_STATS.creatureTrust;

  if (c.examined) {
    body += 5;
    trust += 5;
  }
  if (c.journalRead) body += 5;

  if (c.limbs === "silk") body += 20;
  if (c.limbs === "staples") {
    body += 8;
    emotional -= 5;
  }

  if (c.heartPrep === "serum") {
    body += 15;
    neural += 5;
  }
  if (c.heartPrep === "direct") body += 5;

  if (c.brain === "scholar") {
    neural += 25;
    emotional += 5;
  }
  if (c.brain === "damaged") {
    neural += 5;
    emotional -= 15;
  }

  if (c.restraints === "loose") trust += 15;
  if (c.restraints === "tight") {
    trust -= 15;
    emotional -= 10;
  }

  if (c.calibration) {
    neural += 20 * closeness(c.calibration.voltage, OPTIMAL_RANGES.voltage);
    neural += 10 * closeness(c.calibration.frequency, OPTIMAL_RANGES.frequency);
    emotional += sedationEffect(c.calibration.sedation);
  }

  if (c.spokeToCreature) {
    trust += 15;
    emotional += 5;
  }
  if (c.blanketGiven) {
    trust += 10;
    emotional += 10;
  }

  return {
    bodyStability: clamp(body),
    neuralStability: clamp(neural),
    emotionalStability: clamp(emotional),
    creatureTrust: clamp(trust),
  };
}

export function determineEnding(stats: Stats): EndingResult {
  const failures = (Object.keys(THRESHOLDS) as (keyof Stats)[]).filter(
    (key) => stats[key] < THRESHOLDS[key],
  );
  return { kind: failures.length === 0 ? "good" : "bad", failures };
}

export const STAT_LABELS: Record<keyof Stats, string> = {
  bodyStability: "Body stability",
  neuralStability: "Neural stability",
  emotionalStability: "Emotional stability",
  creatureTrust: "Creature trust",
};

export const FAILURE_EXPLANATIONS: Record<keyof Stats, string> = {
  bodyStability: "Its stitched body tore under the galvanic surge, and the pain drove it mad.",
  neuralStability: "Its nervous system misfired. It woke to a storm of noise and lashed out at the nearest shape.",
  emotionalStability: "It woke in terror. Fear turned to fury in a heartbeat.",
  creatureTrust: "It saw its maker as a jailer, and it would not stay in chains.",
};
