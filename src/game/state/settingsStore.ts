import { create } from "zustand";

export type Quality = "auto" | "high" | "low";

export interface Settings {
  volume: number;
  sensitivity: number;
  quality: Quality;
}

const STORAGE_KEY = "frankenstein.settings";
const DEFAULTS: Settings = { volume: 0.8, sensitivity: 1, quality: "auto" };

function load(): Settings {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(settings: Settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode); settings then last for this visit only.
  }
}

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...load(),
  update: (patch) => {
    set(patch);
    const { volume, sensitivity, quality } = get();
    save({ volume, sensitivity, quality });
  },
}));
