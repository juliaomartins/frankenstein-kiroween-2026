"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { initAudio, setMasterVolume } from "../audio";
import { useGame } from "../state/gameStore";
import { useSettings, type Quality } from "../state/settingsStore";
import { KeyCap } from "./Hud";
import { BookIcon, ChevronIcon, GearIcon, PowerIcon } from "./Icons";
import { Modal, PrimaryButton } from "./Panels";

type Overlay = "options" | "credits" | "farewell" | null;

function lockPointer() {
  const canvas = document.querySelector("canvas");
  const req = canvas?.requestPointerLock() as unknown as Promise<void> | undefined;
  req?.catch?.(() => useGame.getState().setPointerLockFailed(true));
}

function HeartbeatDivider() {
  return (
    <div className="title-reveal relative mx-auto mt-2 h-6 w-[min(760px,88vw)]" style={{ animationDelay: "0.35s" }} aria-hidden>
      <svg viewBox="0 0 760 24" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ecg-fade" x1="0" x2="1">
            <stop offset="0" stopColor="#ff2a2a" stopOpacity="0" />
            <stop offset="0.25" stopColor="#ff2a2a" stopOpacity="0.85" />
            <stop offset="0.75" stopColor="#ff2a2a" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ff2a2a" stopOpacity="0" />
          </linearGradient>
          <filter id="ecg-glow" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="ecg-line"
          d="M0 12 H344 L352 12 L357 4 L363 21 L369 1 L375 18 L380 12 H416 L760 12"
          fill="none"
          stroke="url(#ecg-fade)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          filter="url(#ecg-glow)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function OrnateButton({
  children,
  onClick,
  primary = false,
  icon,
  delay,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  icon?: React.ReactNode;
  delay: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ornate-btn title-reveal group ${primary ? "ornate-btn--primary" : ""}`}
      style={{ animationDelay: delay }}
    >
      <span className="ornate-btn__frame" aria-hidden />
      <span className="ornate-btn__fill" aria-hidden />
      <span className="ornate-btn__tip ornate-btn__tip--left" aria-hidden />
      <span className="ornate-btn__tip ornate-btn__tip--right" aria-hidden />
      <span className="relative flex items-center justify-center gap-3">
        {icon && <span className="h-5 w-5 text-parchment/80 transition group-hover:text-gold">{icon}</span>}
        <span>{children}</span>
        {primary && <ChevronIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
      </span>
    </button>
  );
}

function LoadStatus() {
  const { active, progress } = useProgress();
  const loading = active || progress < 100;
  return (
    <p className="title-reveal mt-[1.4vh] h-4 text-center font-serif text-sm italic tracking-wide text-parchment/55" style={{ animationDelay: "1.1s" }} aria-live="polite">
      {loading ? `Preparing the laboratory… ${Math.round(progress)}%` : "The laboratory is ready."}
    </p>
  );
}

const KEY_HINTS: { keys: string[]; label: string }[] = [
  { keys: ["W", "A", "S", "D"], label: "Move" },
  { keys: ["E"], label: "Interact" },
  { keys: ["F"], label: "Use Tool" },
  { keys: ["Tab"], label: "Inventory" },
  { keys: ["C"], label: "AI Advisor" },
];

function KeyHints() {
  return (
    <div className="title-reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-serif text-[17px] text-parchment/85" style={{ animationDelay: "1.2s" }}>
      {KEY_HINTS.map((h) => (
        <span key={h.label} className="flex items-center gap-2">
          <span className="flex gap-1">
            {h.keys.map((k) => (
              <KeyCap key={k} wide={k.length > 1}>
                {k}
              </KeyCap>
            ))}
          </span>
          {h.label}
        </span>
      ))}
    </div>
  );
}

function OptionsPanel({ onClose }: { onClose: () => void }) {
  const { volume, sensitivity, quality, update } = useSettings();
  const qualities: { value: Quality; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "high", label: "High" },
    { value: "low", label: "Low" },
  ];
  return (
    <Modal title="Options" subtitle="Saved in this browser" onClose={onClose}>
      <label className="mb-6 block">
        <div className="mb-2 flex justify-between font-display text-sm uppercase tracking-[0.18em] text-parchment/80">
          <span>Volume</span>
          <span className="font-mono text-gold">{Math.round(volume * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => update({ volume: Number(e.target.value) / 100 })} className="gothic-range w-full" />
      </label>
      <label className="mb-6 block">
        <div className="mb-2 flex justify-between font-display text-sm uppercase tracking-[0.18em] text-parchment/80">
          <span>Mouse sensitivity</span>
          <span className="font-mono text-gold">{sensitivity.toFixed(2)}×</span>
        </div>
        <input type="range" min={25} max={250} value={Math.round(sensitivity * 100)} onChange={(e) => update({ sensitivity: Number(e.target.value) / 100 })} className="gothic-range w-full" />
      </label>
      <fieldset className="mb-6">
        <legend className="mb-2 font-display text-sm uppercase tracking-[0.18em] text-parchment/80">Graphics quality</legend>
        <div className="grid grid-cols-3 gap-2">
          {qualities.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => update({ quality: q.value })}
              className={`rounded-lg border px-3 py-2 font-semibold transition ${quality === q.value ? "border-gold bg-gold/10 text-white" : "border-white/15 text-white/70 hover:border-white/40"}`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/50">Auto lowers bloom, anti-aliasing and resolution if the frame rate drops.</p>
      </fieldset>
      <div className="flex justify-end">
        <PrimaryButton onClick={onClose}>Done</PrimaryButton>
      </div>
    </Modal>
  );
}

function CreditsPanel({ onClose }: { onClose: () => void }) {
  const link = "underline decoration-gold/40 underline-offset-2 hover:text-gold";
  return (
    <Modal title="Credits" subtitle="Frankenstein: The Creator's Choice · Kiroween 2026" onClose={onClose}>
      <dl className="space-y-4 font-serif text-[17px] leading-snug text-parchment/90">
        <div>
          <dt className="font-display text-xs uppercase tracking-[0.2em] text-gold/80">Inspired by</dt>
          <dd>Mary Shelley, <i>Frankenstein; or, The Modern Prometheus</i> (1818)</dd>
        </div>
        <div>
          <dt className="font-display text-xs uppercase tracking-[0.2em] text-gold/80">Creature model</dt>
          <dd>
            <a className={link} href="https://sketchfab.com/3d-models/frankenstein-s-monster-0e8d66cb3d4b486b9172f320f70b520f" target="_blank" rel="noreferrer">
              &ldquo;Frankenstein S Monster&rdquo;
            </a>{" "}
            by{" "}
            <a className={link} href="https://sketchfab.com/samierh49" target="_blank" rel="noreferrer">
              ennana
            </a>
            ,{" "}
            <a className={link} href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
              CC BY 4.0
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-display text-xs uppercase tracking-[0.2em] text-gold/80">First-person hands</dt>
          <dd>
            <a className={link} href="https://sketchfab.com/3d-models/hands-animation-9f63e924253b4179adb79b117a26d385" target="_blank" rel="noreferrer">
              &ldquo;hands animation&rdquo;
            </a>{" "}
            by{" "}
            <a className={link} href="https://sketchfab.com/hugocolauto" target="_blank" rel="noreferrer">
              hugo colauto
            </a>
            , Sketchfab Standard licence
          </dd>
        </div>
        <div>
          <dt className="font-display text-xs uppercase tracking-[0.2em] text-gold/80">AI Advisor</dt>
          <dd>Powered by Claude, by Anthropic</dd>
        </div>
        <div>
          <dt className="font-display text-xs uppercase tracking-[0.2em] text-gold/80">Built with</dt>
          <dd>Next.js, React Three Fiber, Three.js, Drei, Zustand and Tailwind CSS</dd>
        </div>
      </dl>
      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={onClose}>Close</PrimaryButton>
      </div>
    </Modal>
  );
}

function Farewell({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 p-6 text-center">
      <p className="font-display text-3xl tracking-wide text-parchment">The candles gutter out.</p>
      <p className="max-w-md font-serif text-lg text-parchment/70">The laboratory falls silent. You can close this tab now, or step back inside.</p>
      <PrimaryButton onClick={onReturn}>Return to the laboratory</PrimaryButton>
    </div>
  );
}

export function TitleScreen() {
  const phase = useGame((s) => s.phase);
  const start = useGame((s) => s.start);
  const volume = useSettings((s) => s.volume);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  if (phase !== "title") return null;

  const enter = () => {
    initAudio();
    start();
    lockPointer();
  };

  const exit = () => {
    window.close();
    setOverlay("farewell");
  };

  return (
    <div className="title-screen fixed inset-0 z-40 flex flex-col items-center overflow-y-auto px-4 pb-[2.5vh] pt-[4.5vh] text-center">
      <header className="w-full">
        <p className="title-reveal font-display text-[clamp(10px,1.35vw,20px)] uppercase tracking-[0.3em] sm:tracking-[0.42em] text-parchment/90" style={{ animationDelay: "0.05s" }}>
          Ingolstadt · November 1797
        </p>
        <h1 className="title-reveal title-wordmark mt-2 font-display text-[clamp(30px,min(8.4vw,13.5vh),132px)] font-bold leading-[0.95]" style={{ animationDelay: "0.15s" }}>
          Frankenstein
        </h1>
        <HeartbeatDivider />
        <p className="title-reveal mt-1 font-display text-[clamp(14px,min(2.6vw,4.4vh),40px)] font-bold uppercase tracking-[0.2em] sm:tracking-[0.28em] text-gold drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" style={{ animationDelay: "0.45s" }}>
          The Creator&apos;s Choice
        </p>
        <p className="title-reveal mx-auto mt-[2vh] max-w-[580px] font-serif text-[clamp(15px,min(1.35vw,2.4vh),21px)] leading-relaxed text-parchment/95 [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]" style={{ animationDelay: "0.6s" }}>
          The storm has come at last. On the table lies the work of two years: a body stitched from the dead. Tonight you will give it life. What it becomes depends on
          how you make it, and how you treat it.
        </p>
      </header>

      <div className="min-h-[14vh] flex-1" />

      <nav className="flex w-full flex-col items-center gap-[1.2vh]" aria-label="Main menu">
        <OrnateButton primary onClick={enter} delay="0.75s">
          Enter the Laboratory
        </OrnateButton>
        <OrnateButton icon={<GearIcon />} onClick={() => setOverlay("options")} delay="0.85s">
          Options
        </OrnateButton>
        <OrnateButton icon={<BookIcon />} onClick={() => setOverlay("credits")} delay="0.95s">
          Credits
        </OrnateButton>
        <OrnateButton icon={<PowerIcon />} onClick={exit} delay="1.05s">
          Exit
        </OrnateButton>
      </nav>
      <LoadStatus />

      <footer className="mt-[2vh] w-full">
        <KeyHints />
      </footer>

      {overlay === "options" && <OptionsPanel onClose={() => setOverlay(null)} />}
      {overlay === "credits" && <CreditsPanel onClose={() => setOverlay(null)} />}
      {overlay === "farewell" && <Farewell onReturn={() => setOverlay(null)} />}
    </div>
  );
}
