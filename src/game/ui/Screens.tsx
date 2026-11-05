"use client";

import { initAudio } from "../audio";
import { FAILURE_EXPLANATIONS } from "../logic/rules";
import { useGame } from "../state/gameStore";
import { KeyCap } from "./Hud";
import { PrimaryButton } from "./Panels";

function lockPointer() {
  const canvas = document.querySelector("canvas");
  const req = canvas?.requestPointerLock() as unknown as Promise<void> | undefined;
  req?.catch?.(() => undefined);
}

export function TitleScreen() {
  const phase = useGame((s) => s.phase);
  const start = useGame((s) => s.start);
  if (phase !== "title") return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-black/70 via-black/50 to-black/85 p-4">
      <div className="max-w-xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.5em] text-parchment/70">Ingolstadt · November 1797</p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-wide text-parchment drop-shadow-[0_0_25px_rgba(232,182,76,0.35)] sm:text-7xl">Frankenstein</h1>
        <p className="mt-2 font-display text-xl tracking-[0.3em] text-gold sm:text-2xl">THE CREATOR&apos;S CHOICE</p>
        <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-white/75">
          The storm has come at last. On the table lies the work of two years: a body stitched from the dead. Tonight you will give it life. What it becomes depends on
          how you make it, and how you treat it.
        </p>
        <div className="mt-8 flex justify-center">
          <PrimaryButton
            onClick={() => {
              initAudio();
              start();
              lockPointer();
            }}
          >
            Enter the laboratory
          </PrimaryButton>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <KeyCap>W</KeyCap>
            <KeyCap>A</KeyCap>
            <KeyCap>S</KeyCap>
            <KeyCap>D</KeyCap> move
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap>E</KeyCap> interact
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap>F</KeyCap> use tool
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap wide>Tab</KeyCap> inventory
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap>C</KeyCap> advisor
          </span>
        </div>
        <p className="mt-4 text-xs text-white/40">Best with headphones. Requires a mouse and keyboard.</p>
      </div>
    </div>
  );
}

export function CinematicOverlay() {
  const cinematic = useGame((s) => s.cinematic);
  const phase = useGame((s) => s.phase);
  if (phase !== "awakening") return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <div className="absolute inset-x-0 top-0 h-[10vh] bg-black" />
      <div className="absolute inset-x-0 bottom-0 h-[10vh] bg-black" />
      {cinematic === "surge" && <div className="absolute inset-0 animate-[flicker_0.15s_steps(2)_infinite] bg-sky-200/10" />}
      {(cinematic === "rise" || cinematic === "attack") && (
        <div className={`absolute inset-0 ${cinematic === "attack" ? "bg-[radial-gradient(circle,transparent_20%,rgba(140,0,0,0.75))]" : "bg-[radial-gradient(circle,transparent_45%,rgba(120,0,0,0.45))]"} animate-pulse`} />
      )}
      {cinematic === "peace" && <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,200,120,0.08),transparent_60%)]" />}
    </div>
  );
}

export function EndingScreen() {
  const phase = useGame((s) => s.phase);
  const ending = useGame((s) => s.ending);
  const log = useGame((s) => s.choiceLog);
  const restart = useGame((s) => s.restart);
  if (phase !== "ending" || !ending) return null;
  const good = ending.kind === "good";
  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-4 ${good ? "bg-black/70" : "bg-[#1a0000]/90"}`}>
      <div className="w-full max-w-2xl py-10 text-center">
        <p className="font-display text-sm uppercase tracking-[0.5em] text-parchment/60">{good ? "Ending I" : "Ending II"}</p>
        <h1 className={`mt-3 font-display text-4xl font-bold tracking-wide sm:text-6xl ${good ? "text-gold" : "text-red-300"}`}>
          {good ? "A Gentle Awakening" : "The Creator Destroyed"}
        </h1>
        {good ? (
          <div className="mx-auto mt-6 max-w-lg space-y-3 text-[16px] leading-relaxed text-white/85">
            <p>Its eyes open slowly. It finds your face, and does not look away. When you reach out, it takes your hand with a care that astonishes you.</p>
            <p>In the months that follow you teach it to speak, to read, to sit by the fire. It is slow to trust the villagers, and they slower still to trust it. But it learns. It lives.</p>
            <p className="italic text-parchment/80">You made a life, and then you chose to love it. That was the real experiment.</p>
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-lg space-y-3 text-[16px] leading-relaxed text-white/85">
            <p>It wakes screaming. The straps part like thread. Before you can speak, it is upon you, and the last thing you see is your own work, looking down at you with nothing but agony in its eyes.</p>
            <ul className="space-y-2 text-left text-[15px] text-red-100/85">
              {ending.failures.map((f) => (
                <li key={f} className="rounded-md border border-red-400/20 bg-red-950/40 px-3 py-2">
                  {FAILURE_EXPLANATIONS[f]}
                </li>
              ))}
            </ul>
          </div>
        )}
        <details className="mx-auto mt-8 max-w-lg text-left text-sm text-white/60">
          <summary className="cursor-pointer font-display tracking-wide text-parchment/80">The choices you made</summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {log.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ol>
        </details>
        <div className="mt-8 flex justify-center">
          <PrimaryButton
            onClick={() => {
              restart();
              lockPointer();
            }}
          >
            {good ? "Begin again" : "Try again"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
