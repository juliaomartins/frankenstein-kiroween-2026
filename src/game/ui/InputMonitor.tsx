"use client";

import { useEffect, useRef, useState } from "react";
import { inputStats } from "../scene/inputStats";
import { useGame } from "../state/gameStore";

const KEY_LABELS: Record<string, string> = {
  KeyW: "W",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
};

const SAMPLE_MS = 250;

interface Reading {
  keys: string[];
  movesPerSec: number;
  swipesPerSec: number;
  turnDegPerSec: number;
  captured: boolean;
}

export function InputMonitor() {
  const open = useGame((s) => s.inputMonitor);
  const [reading, setReading] = useState<Reading | null>(null);
  const last = useRef({ moves: 0, swipes: 0, turned: 0 });

  useEffect(() => {
    if (!open) return;
    last.current = { moves: inputStats.pointerEvents, swipes: inputStats.wheelEvents, turned: inputStats.turnedRad };
    const id = window.setInterval(() => {
      const scale = 1000 / SAMPLE_MS;
      setReading({
        keys: [...new Set([...inputStats.keysHeld].map((k) => KEY_LABELS[k]).filter(Boolean))],
        movesPerSec: Math.round((inputStats.pointerEvents - last.current.moves) * scale),
        swipesPerSec: Math.round((inputStats.wheelEvents - last.current.swipes) * scale),
        turnDegPerSec: Math.round(((inputStats.turnedRad - last.current.turned) * scale * 180) / Math.PI),
        captured: !!document.pointerLockElement,
      });
      last.current = { moves: inputStats.pointerEvents, swipes: inputStats.wheelEvents, turned: inputStats.turnedRad };
    }, SAMPLE_MS);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open || !reading) return null;
  const blocked = reading.keys.length > 0 && reading.movesPerSec === 0 && reading.swipesPerSec === 0;
  const row = "flex justify-between gap-6";
  return (
    <section className="hud-panel pointer-events-none absolute left-1/2 top-4 w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 p-3 font-mono text-[13px] text-white/90" aria-live="polite">
      <div className="mb-2 flex justify-between font-sans text-xs uppercase tracking-[0.18em] text-gold">
        <span>Input monitor</span>
        <span className="text-white/45">F2 to close</span>
      </div>
      <div className={row}>
        <span>Keys held</span>
        <span>{reading.keys.length ? reading.keys.join(" ") : "none"}</span>
      </div>
      <div className={row}>
        <span>Mouse / touchpad moves</span>
        <span className={reading.movesPerSec > 0 ? "text-emerald-300" : "text-white/50"}>{reading.movesPerSec}/s</span>
      </div>
      <div className={row}>
        <span>Two-finger swipes</span>
        <span className={reading.swipesPerSec > 0 ? "text-emerald-300" : "text-white/50"}>{reading.swipesPerSec}/s</span>
      </div>
      <div className={row}>
        <span>View turning</span>
        <span>{reading.turnDegPerSec}°/s</span>
      </div>
      <div className={row}>
        <span>Mouse captured</span>
        <span>{reading.captured ? "yes" : "no"}</span>
      </div>
      <p className={`mt-2 font-sans text-xs leading-snug ${blocked ? "text-amber-200" : "text-white/55"}`}>
        {blocked
          ? "Keys are held and no pointer movement is arriving. If you are moving your finger, your laptop is blocking the touchpad while typing."
          : "Hold W and move your finger on the touchpad. Moves should stay above 0 while the key is held."}
      </p>
    </section>
  );
}
