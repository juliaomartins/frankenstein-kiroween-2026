import { describe, expect, it } from "vitest";
import { EMPTY_CHOICES, THRESHOLDS, closeness, computeStats, determineEnding } from "./rules";
import { currentObjective, objectiveStatus } from "./progress";
import type { Choices } from "./types";

const ideal: Choices = {
  examined: true,
  journalRead: true,
  limbs: "silk",
  heartPrep: "serum",
  brain: "scholar",
  restraints: "loose",
  calibration: { voltage: 62, frequency: 42, sedation: 30 },
  spokeToCreature: true,
  blanketGiven: true,
};

describe("computeStats", () => {
  it("starts every stat below the awakening threshold", () => {
    const stats = computeStats(EMPTY_CHOICES);
    for (const key of Object.keys(THRESHOLDS) as (keyof typeof THRESHOLDS)[]) {
      expect(stats[key]).toBeLessThan(THRESHOLDS[key]);
    }
  });

  it("is deterministic for identical choices", () => {
    expect(computeStats(ideal)).toEqual(computeStats({ ...ideal }));
  });

  it("clamps stats to 0..100", () => {
    const worst: Choices = {
      ...EMPTY_CHOICES,
      limbs: "staples",
      brain: "damaged",
      restraints: "tight",
      calibration: { voltage: 0, frequency: 100, sedation: 0 },
    };
    const stats = computeStats(worst);
    for (const value of Object.values(stats)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe("closeness", () => {
  it("is 1 inside the range and falls off to 0", () => {
    expect(closeness(60, [55, 70])).toBe(1);
    expect(closeness(45, [55, 70])).toBeCloseTo(0.6);
    expect(closeness(0, [55, 70])).toBe(0);
  });
});

describe("determineEnding", () => {
  it("gives the good ending for careful, humane choices", () => {
    expect(determineEnding(computeStats(ideal))).toEqual({ kind: "good", failures: [] });
  });

  it("still allows a good ending without the optional comforts if surgery and calibration are excellent", () => {
    const result = determineEnding(
      computeStats({ ...ideal, journalRead: false, blanketGiven: false }),
    );
    expect(result.kind).toBe("good");
  });

  it("gives the bad ending when the damaged brain is used", () => {
    const result = determineEnding(computeStats({ ...ideal, brain: "damaged" }));
    expect(result.kind).toBe("bad");
    expect(result.failures).toContain("neuralStability");
  });

  it("gives the bad ending when the creature is chained and never comforted", () => {
    const result = determineEnding(
      computeStats({ ...ideal, restraints: "tight", spokeToCreature: false, blanketGiven: false }),
    );
    expect(result.kind).toBe("bad");
    expect(result.failures).toContain("creatureTrust");
  });

  it("gives the bad ending when awakened without calibration", () => {
    const result = determineEnding(computeStats({ ...ideal, calibration: null }));
    expect(result.kind).toBe("bad");
  });
});

describe("objectives", () => {
  it("tracks the next objective in order", () => {
    const base = { choices: EMPTY_CHOICES, collected: [], distanceWalked: 0, advisorAsked: false, creatureAwake: false };
    expect(currentObjective(base)).toBe("Explore the laboratory");
    const status = objectiveStatus({
      ...base,
      distanceWalked: 10,
      collected: ["heart", "brain_damaged", "galvanic_serum", "suture_kit", "surgical_tools"],
    });
    expect(status.explore).toBe(true);
    expect(status.collect).toBe(true);
    expect(status.examine).toBe(false);
  });
});
