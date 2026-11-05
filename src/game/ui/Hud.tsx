"use client";

import { useEffect } from "react";
import { OBJECTIVES } from "../logic/content";
import { materialsCollected } from "../logic/progress";
import { THRESHOLDS } from "../logic/rules";
import { useGame, useObjectives, useStats } from "../state/gameStore";
import { ArmIcon, BrainIcon, ChatIcon, CheckIcon, DiamondIcon, HandIcon, HeartIcon, MouseIcon } from "./Icons";

export function KeyCap({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center justify-center rounded-md border border-white/70 bg-black/40 font-semibold text-[13px] text-white shadow-[inset_0_-2px_0_rgba(255,255,255,0.15)] ${wide ? "px-2" : "w-7"}`}
    >
      {children}
    </span>
  );
}

function ObjectivePanel() {
  const status = useObjectives();
  const collected = useGame((s) => s.collected);
  const firstOpen = OBJECTIVES.find((o) => o.id !== "advisor" && !status[o.id])?.id;
  return (
    <section className="hud-panel pointer-events-none absolute left-4 top-4 w-[min(340px,calc(100vw-2rem))] p-4 sm:left-6 sm:top-6">
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold tracking-wide text-gold">
        <DiamondIcon className="h-5 w-5" /> Objective
      </h2>
      <ul className="space-y-1.5">
        {OBJECTIVES.map((o) => {
          const done = status[o.id];
          const current = o.id === firstOpen;
          return (
            <li key={o.id} className={`flex items-center gap-3 text-[15px] ${done ? "text-white/45" : current ? "text-white" : "text-white/80"}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border ${done ? "border-gold bg-gold/15 text-gold" : current ? "border-white" : "border-white/60"}`}>
                {done && <CheckIcon className="h-3.5 w-3.5" />}
              </span>
              <span className={done ? "line-through decoration-white/30" : ""}>
                {o.label}
                {o.id === "collect" && !done && <span className="ml-1 text-white/55">({materialsCollected(collected)}/5)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AdvisorButton() {
  const toggle = useGame((s) => s.togglePanel);
  const busy = useGame((s) => s.advisorBusy);
  return (
    <button
      type="button"
      onClick={() => toggle("advisor")}
      className="hud-panel pointer-events-auto absolute right-4 top-4 flex items-center gap-2.5 px-4 py-2.5 font-semibold text-white transition hover:border-gold/60 hover:text-gold sm:right-6 sm:top-6"
    >
      <ChatIcon className={`h-6 w-6 ${busy ? "animate-pulse text-gold" : ""}`} />
      <span className="text-[17px]">AI Advisor (C)</span>
    </button>
  );
}

function Crosshair() {
  const hovered = useGame((s) => s.hovered);
  const toast = useGame((s) => s.toasts[s.toasts.length - 1]);
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className={`relative h-9 w-9 rounded-full border-2 transition ${hovered ? "scale-110 border-white" : "border-white/70"}`}>
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <div className="absolute left-1/2 top-16 flex -translate-x-1/2 flex-col items-center gap-2 whitespace-nowrap">
        {hovered?.e && (
          <div className="hud-panel flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[15px] font-medium text-white">
            <KeyCap>E</KeyCap>
            {hovered.e}
          </div>
        )}
        {hovered?.f && (
          <div className="hud-panel flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[15px] font-medium text-white">
            <KeyCap>F</KeyCap>
            {hovered.f}
          </div>
        )}
      </div>
      {toast && <div className="sr-only" aria-live="polite">{toast.text}</div>}
    </div>
  );
}

function ControlsHint() {
  return (
    <section className="pointer-events-none absolute bottom-5 left-4 hidden space-y-2 text-[15px] text-white/90 sm:left-6 lg:block [text-shadow:0_1px_3px_#000]">
      <div className="flex items-end gap-3">
        <div className="flex flex-col items-center gap-1">
          <KeyCap>W</KeyCap>
          <div className="flex gap-1">
            <KeyCap>A</KeyCap>
            <KeyCap>S</KeyCap>
            <KeyCap>D</KeyCap>
          </div>
        </div>
        <span className="pb-1">or arrow keys · Move</span>
      </div>
      <div className="flex items-center gap-3">
        <MouseIcon className="h-7 w-7" /> Mouse or touchpad · Look
      </div>
      <div className="flex items-center gap-3">
        <KeyCap>E</KeyCap> Interact
        <KeyCap>F</KeyCap> Use tool
      </div>
      <div className="flex items-center gap-3">
        <KeyCap>C</KeyCap> Open AI Advisor
      </div>
      <div className="flex items-center gap-3">
        <KeyCap wide>Tab</KeyCap> Inventory
        <KeyCap wide>Shift</KeyCap> Run
      </div>
    </section>
  );
}

function Meter({ icon, label, value, threshold, color }: { icon: React.ReactNode; label: string; value: number; threshold: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/90">{icon}</span>
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-[14px] text-white/90">
          <span>{label}</span>
          <span className="tabular-nums text-white/55">{value}</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, background: color }} />
          <div className="absolute top-0 h-full w-px bg-white/70" style={{ left: `${threshold}%` }} title="Safe awakening threshold" />
        </div>
      </div>
    </div>
  );
}

function StabilityMeters() {
  const stats = useStats();
  return (
    <section className="hud-panel pointer-events-none absolute bottom-4 right-4 w-[min(260px,calc(100vw-2rem))] space-y-3 p-4 sm:bottom-6 sm:right-6">
      <Meter icon={<ArmIcon className="h-6 w-6" />} label="Body Stability" value={stats.bodyStability} threshold={THRESHOLDS.bodyStability} color="linear-gradient(90deg,#3fae5b,#7be08c)" />
      <Meter icon={<BrainIcon className="h-6 w-6" />} label="Neural Stability" value={stats.neuralStability} threshold={THRESHOLDS.neuralStability} color="linear-gradient(90deg,#3f9fae,#8be0d4)" />
      <Meter icon={<HeartIcon className="h-6 w-6" />} label="Emotional Stability" value={stats.emotionalStability} threshold={THRESHOLDS.emotionalStability} color="linear-gradient(90deg,#3fae5b,#a8e07b)" />
      <Meter icon={<HandIcon className="h-6 w-6" />} label="Creature Trust" value={stats.creatureTrust} threshold={THRESHOLDS.creatureTrust} color="linear-gradient(90deg,#ae8a3f,#e8c46b)" />
    </section>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 4200);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);
  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 flex w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-2 md:bottom-10">
      {toasts.map((t) => (
        <div key={t.id} className="hud-panel animate-[fadein_0.3s_ease-out] px-4 py-2 text-center font-display text-[15px] text-parchment">
          {t.text}
        </div>
      ))}
    </div>
  );
}

function ResumeHint() {
  const locked = useGame((s) => s.pointerLocked);
  const failed = useGame((s) => s.pointerLockFailed);
  const panel = useGame((s) => s.panel);
  const phase = useGame((s) => s.phase);
  if (locked || panel || phase !== "playing") return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/60 px-4 py-2 text-center text-sm tracking-wide text-white/85">
      {failed
        ? "Move the mouse or touchpad to look while you walk · hold the cursor at the screen edge to keep turning"
        : "Move the mouse or touchpad to look · click the scene for unlimited turning · Esc releases it"}
    </div>
  );
}

export function Hud() {
  const phase = useGame((s) => s.phase);
  if (phase !== "playing") return null;
  return (
    <div className="pointer-events-none fixed inset-0 select-none">
      <ObjectivePanel />
      <AdvisorButton />
      <Crosshair />
      <ResumeHint />
      <ControlsHint />
      <StabilityMeters />
      <Toasts />
    </div>
  );
}
