import { create } from "zustand";
import { EXPLORE_DISTANCE, ITEMS } from "../logic/content";
import { currentObjective, hasAllMaterials, isAssembled, materialsCollected, objectiveStatus } from "../logic/progress";
import { EMPTY_CHOICES, computeStats, determineEnding } from "../logic/rules";
import type {
  BrainChoice,
  Calibration,
  Choices,
  EndingResult,
  GameState,
  HeartPrep,
  ItemId,
  LimbMethod,
  RestraintChoice,
} from "../logic/types";

export type Phase = "title" | "playing" | "awakening" | "ending";
export type Cinematic = "surge" | "stir" | "rise" | "attack" | "peace" | null;
export type Panel = "inventory" | "advisor" | "assembly" | "calibration" | "journal" | "awaken" | "report" | null;

export interface Prompt {
  id: string;
  e?: string;
  f?: string;
}

export interface Toast {
  id: number;
  text: string;
}

export interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssemblyPlan {
  limbs: LimbMethod;
  heartPrep: HeartPrep;
  restraints: RestraintChoice;
}

interface Store {
  phase: Phase;
  panel: Panel;
  choices: Choices;
  inventory: ItemId[];
  collected: ItemId[];
  equipped: ItemId | null;
  distanceWalked: number;
  advisorAsked: boolean;
  advisorMessages: AdvisorMessage[];
  advisorBusy: boolean;
  choiceLog: string[];
  hovered: Prompt | null;
  handAction: { kind: "reach" | "use"; at: number };
  toasts: Toast[];
  creatureAwake: boolean;
  victorAlive: boolean;
  ending: EndingResult | null;
  pointerLocked: boolean;
  pointerLockFailed: boolean;
  cinematic: Cinematic;

  start: () => void;
  setCinematic: (cinematic: Cinematic) => void;
  restart: () => void;
  openPanel: (panel: Panel) => void;
  togglePanel: (panel: Exclude<Panel, null>) => void;
  closePanel: () => void;
  setHovered: (prompt: Prompt | null) => void;
  setPointerLocked: (locked: boolean) => void;
  setPointerLockFailed: (failed: boolean) => void;
  addDistance: (meters: number) => void;
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
  equip: (id: ItemId | null) => void;
  interact: (targetId: string) => void;
  useTool: (targetId: string) => void;
  readJournal: () => void;
  applyAssembly: (plan: AssemblyPlan) => void;
  applyCalibration: (calibration: Calibration) => void;
  awaken: () => void;
  finishAwakening: () => void;
  addAdvisorMessage: (message: AdvisorMessage) => void;
  appendToLastAdvisorMessage: (text: string) => void;
  setAdvisorBusy: (busy: boolean) => void;
}

let toastSeq = 0;

const ITEM_TARGETS: Record<string, ItemId> = {
  heart_jar: "heart",
  brain_scholar_jar: "brain_scholar",
  brain_damaged_jar: "brain_damaged",
  serum_jar: "galvanic_serum",
  suture_kit: "suture_kit",
  tool_tray: "surgical_tools",
  blanket: "blanket",
};

const initialState = {
  phase: "title" as Phase,
  panel: null as Panel,
  choices: EMPTY_CHOICES,
  inventory: [] as ItemId[],
  collected: [] as ItemId[],
  equipped: null as ItemId | null,
  distanceWalked: 0,
  advisorAsked: false,
  advisorMessages: [] as AdvisorMessage[],
  advisorBusy: false,
  choiceLog: [] as string[],
  hovered: null as Prompt | null,
  handAction: { kind: "reach" as const, at: -10 },
  toasts: [] as Toast[],
  creatureAwake: false,
  victorAlive: true,
  ending: null as EndingResult | null,
  pointerLocked: false,
  pointerLockFailed: false,
  cinematic: null as Cinematic,
};

export const useGame = create<Store>((set, get) => {
  const log = (entry: string) => set((s) => ({ choiceLog: [...s.choiceLog, entry] }));
  const reach = (kind: "reach" | "use" = "reach") => set({ handAction: { kind, at: performance.now() / 1000 } });

  const pickUp = (item: ItemId) => {
    const s = get();
    if (s.collected.includes(item)) {
      s.toast(`You already took the ${ITEMS[item].name.toLowerCase()}.`);
      return;
    }
    if ((item === "brain_scholar" || item === "brain_damaged") && s.collected.some((i) => i.startsWith("brain_"))) {
      s.toast("You have already chosen a brain. There is no going back.");
      return;
    }
    reach();
    set((st) => ({
      inventory: [...st.inventory, item],
      collected: [...st.collected, item],
      equipped: item === "surgical_tools" ? "surgical_tools" : st.equipped,
    }));
    const count = materialsCollected(get().collected);
    get().toast(`Collected: ${ITEMS[item].name}${ITEMS[item].required ? ` (${count}/5 materials)` : ""}`);
    if (item === "brain_scholar") log("Chose the brain of a calm scholar.");
    if (item === "brain_damaged") log("Chose the damaged, scarred brain.");
    if (item === "blanket") log("Took a wool blanket to comfort the creature.");
  };

  return {
    ...initialState,

    start: () => set({ phase: "playing" }),
    setCinematic: (cinematic) => set({ cinematic }),
    restart: () => set({ ...initialState, phase: "playing" }),
    openPanel: (panel) => set({ panel }),
    togglePanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel })),
    closePanel: () => set({ panel: null }),
    setHovered: (prompt) => {
      const prev = get().hovered;
      if (prev?.id === prompt?.id && prev?.e === prompt?.e && prev?.f === prompt?.f) return;
      set({ hovered: prompt });
    },
    setPointerLocked: (pointerLocked) => set(pointerLocked ? { pointerLocked, pointerLockFailed: false } : { pointerLocked }),
    setPointerLockFailed: (pointerLockFailed) => set({ pointerLockFailed }),
    addDistance: (meters) => {
      const before = get().distanceWalked;
      if (before >= EXPLORE_DISTANCE) return;
      const after = before + meters;
      set({ distanceWalked: after });
      if (after >= EXPLORE_DISTANCE) get().toast("You know every corner of this room. Now gather what the work requires.");
    },
    toast: (text) => {
      const id = ++toastSeq;
      set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text }] }));
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    equip: (id) => set({ equipped: id }),

    interact: (targetId) => {
      const s = get();
      if (s.phase !== "playing") return;
      const item = ITEM_TARGETS[targetId];
      if (item) {
        pickUp(item);
        return;
      }
      switch (targetId) {
        case "journal":
          reach();
          set({ panel: "journal" });
          return;
        case "creature": {
          reach();
          const c = s.choices;
          if (!c.examined) {
            set({ choices: { ...c, examined: true }, panel: "report" });
            log("Examined the creature's body carefully before operating.");
            return;
          }
          if (isAssembled(c) && s.inventory.includes("blanket") && !c.blanketGiven) {
            set({
              choices: { ...c, blanketGiven: true },
              inventory: s.inventory.filter((i) => i !== "blanket"),
            });
            log("Covered the creature with a warm blanket.");
            s.toast("You drape the blanket over the still body. Its brow seems to soften.");
            return;
          }
          if (isAssembled(c) && !c.spokeToCreature) {
            set({ choices: { ...c, spokeToCreature: true } });
            log("Spoke softly to the creature and promised to care for it.");
            s.toast("\"You will not be alone. I will care for you.\" A finger twitches.");
            return;
          }
          set({ panel: "report" });
          return;
        }
        case "console":
          if (!isAssembled(s.choices)) {
            s.toast("The neural apparatus has nothing to connect to yet. Assemble the body first.");
            return;
          }
          reach();
          set({ panel: "calibration" });
          return;
        case "lever":
          if (!isAssembled(s.choices)) {
            s.toast("Pulling the lever now would only burn dead flesh. Assemble the body first.");
            return;
          }
          reach();
          set({ panel: "awaken" });
          return;
        case "window":
          s.toast("Rain lashes the glass. Somewhere beyond the storm, Geneva sleeps.");
          return;
        case "tesla":
          s.toast("The coil hums. The capacitors are charged and waiting for the lever.");
          return;
        default:
          return;
      }
    },

    useTool: (targetId) => {
      const s = get();
      if (s.phase !== "playing") return;
      if (s.equipped !== "surgical_tools") {
        s.toast(s.inventory.includes("surgical_tools") ? "Equip the surgical tools first (Tab)." : "You have no tools to use.");
        return;
      }
      if (targetId !== "creature") {
        s.toast("There is nothing here to operate on.");
        return;
      }
      if (isAssembled(s.choices)) {
        s.toast("The body is assembled. Only the neural apparatus and the lever remain.");
        return;
      }
      if (!s.choices.examined) {
        s.toast("Examine the body first (E) before you cut.");
        return;
      }
      if (!hasAllMaterials(s.collected)) {
        s.toast(`You are missing materials (${materialsCollected(s.collected)}/5). Search the laboratory.`);
        return;
      }
      reach("use");
      set({ panel: "assembly" });
    },

    readJournal: () => {
      const s = get();
      if (!s.choices.journalRead) {
        set({
          choices: { ...s.choices, journalRead: true },
          inventory: s.inventory.includes("journal") ? s.inventory : [...s.inventory, "journal"],
          collected: s.collected.includes("journal") ? s.collected : [...s.collected, "journal"],
        });
        log("Studied the anatomy journal and its calibration notes.");
      }
    },

    applyAssembly: (plan) => {
      const s = get();
      const brain: BrainChoice = s.collected.includes("brain_scholar") ? "scholar" : "damaged";
      set({
        choices: { ...s.choices, ...plan, brain },
        inventory: s.inventory.filter(
          (i) => !["heart", "brain_scholar", "brain_damaged", "galvanic_serum", "suture_kit"].includes(i),
        ),
        panel: null,
      });
      log(plan.limbs === "silk" ? "Joined the limbs with fine silk sutures." : "Stapled the limbs together with iron staples.");
      log(plan.heartPrep === "serum" ? "Flushed the heart with galvanic serum before installing it." : "Installed the heart without priming it.");
      log(`Implanted the ${brain === "scholar" ? "scholar's" : "damaged"} brain.`);
      log(plan.restraints === "loose" ? "Loosened the restraints as a gesture of trust." : "Tightened every restraint.");
      reach("use");
      get().toast("The body is whole. Now configure the neural apparatus at the console.");
    },

    applyCalibration: (calibration) => {
      const s = get();
      set({ choices: { ...s.choices, calibration }, panel: null });
      log(
        `Calibrated the neural apparatus: ${calibration.voltage} kV, ${calibration.frequency} Hz, sedation ${calibration.sedation}%.`,
      );
      get().toast("Calibration locked in. The lever awaits your decision.");
    },

    awaken: () => {
      const s = get();
      const ending = determineEnding(computeStats(s.choices));
      log("Pulled the lever to awaken the creature.");
      set({
        panel: null,
        hovered: null,
        phase: "awakening",
        cinematic: "surge",
        creatureAwake: true,
        ending,
        victorAlive: ending.kind === "good",
      });
    },

    finishAwakening: () => set({ phase: "ending" }),

    addAdvisorMessage: (message) =>
      set((s) => ({
        advisorMessages: [...s.advisorMessages, message],
        advisorAsked: s.advisorAsked || message.role === "user",
      })),
    appendToLastAdvisorMessage: (text) =>
      set((s) => {
        const msgs = s.advisorMessages.slice();
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: last.content + text };
        return { advisorMessages: msgs };
      }),
    setAdvisorBusy: (advisorBusy) => set({ advisorBusy }),
  };
});

export function selectProgress(s: Store) {
  return {
    choices: s.choices,
    collected: s.collected,
    distanceWalked: s.distanceWalked,
    advisorAsked: s.advisorAsked,
    creatureAwake: s.creatureAwake,
  };
}

export function useObjectives() {
  const choices = useGame((s) => s.choices);
  const collected = useGame((s) => s.collected);
  const explored = useGame((s) => s.distanceWalked >= EXPLORE_DISTANCE);
  const advisorAsked = useGame((s) => s.advisorAsked);
  const creatureAwake = useGame((s) => s.creatureAwake);
  return objectiveStatus({ choices, collected, distanceWalked: explored ? EXPLORE_DISTANCE : 0, advisorAsked, creatureAwake });
}

export function useStats() {
  const choices = useGame((s) => s.choices);
  return computeStats(choices);
}

export function snapshotGameState(): GameState {
  const s = useGame.getState();
  const stats = computeStats(s.choices);
  return {
    ...stats,
    creatureAwake: s.creatureAwake,
    victorAlive: s.victorAlive,
    currentObjective: currentObjective(selectProgress(s)),
  };
}

export function promptFor(targetId: string): Prompt | null {
  const s = useGame.getState();
  const item = ITEM_TARGETS[targetId];
  if (item) {
    if (s.collected.includes(item)) return null;
    return { id: targetId, e: `Take ${ITEMS[item].name}` };
  }
  const c = s.choices;
  const assembled = isAssembled(c);
  const toolsReady = s.equipped === "surgical_tools";
  switch (targetId) {
    case "journal":
      return { id: targetId, e: "Read Anatomy Journal" };
    case "creature": {
      let e = "Examine Creature";
      if (c.examined && assembled && s.inventory.includes("blanket") && !c.blanketGiven) e = "Cover with blanket";
      else if (c.examined && assembled && !c.spokeToCreature) e = "Speak softly to it";
      const f = toolsReady && !assembled ? "Operate" : undefined;
      return { id: targetId, e, f };
    }
    case "console":
      return { id: targetId, e: c.calibration ? "Recalibrate neural apparatus" : "Calibrate neural apparatus" };
    case "lever":
      return { id: targetId, e: "Pull the awakening lever" };
    case "window":
      return { id: targetId, e: "Watch the storm" };
    case "tesla":
      return { id: targetId, e: "Inspect Tesla coil" };
    default:
      return null;
  }
}
