"use client";

import { useState } from "react";
import { ITEMS } from "../logic/content";
import { OPTIMAL_RANGES, THRESHOLDS } from "../logic/rules";
import type { Calibration, HeartPrep, LimbMethod, RestraintChoice } from "../logic/types";
import { useGame, useStats } from "../state/gameStore";
import { KeyCap } from "./Hud";

export function Modal({ title, subtitle, children, onClose, width = "max-w-xl" }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section role="dialog" aria-label={title} className={`gothic-frame relative max-h-[90vh] w-full ${width} overflow-y-auto p-6 text-left sm:p-8`}>
        <button type="button" onClick={onClose} className="absolute right-4 top-3 text-2xl text-white/50 transition hover:text-gold" aria-label="Close">
          ×
        </button>
        <h2 className="font-display text-2xl font-bold tracking-wide text-gold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm italic text-parchment/70">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

function ChoiceGroup<T extends string>({ label, value, onChange, options }: { label: string; value: T | null; onChange: (v: T) => void; options: { value: T; title: string; detail: string }[] }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 font-display text-sm uppercase tracking-[0.18em] text-parchment/80">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg border p-3 text-left transition ${value === o.value ? "border-gold bg-gold/10 text-white" : "border-white/15 bg-white/[0.03] text-white/80 hover:border-white/40"}`}
          >
            <div className="font-semibold">{o.title}</div>
            <div className="mt-1 text-[13px] leading-snug text-white/60">{o.detail}</div>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PrimaryButton({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-5 py-2.5 font-display font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? "border-red-400/70 bg-red-900/40 text-red-100 hover:bg-red-800/60" : "border-gold/70 bg-gold/15 text-gold hover:bg-gold/25"
      }`}
    >
      {children}
    </button>
  );
}

function AssemblyPanel() {
  const close = useGame((s) => s.closePanel);
  const apply = useGame((s) => s.applyAssembly);
  const brain = useGame((s) => (s.collected.includes("brain_scholar") ? "scholar" : "damaged"));
  const [limbs, setLimbs] = useState<LimbMethod | null>(null);
  const [heartPrep, setHeartPrep] = useState<HeartPrep | null>(null);
  const [restraints, setRestraints] = useState<RestraintChoice | null>(null);
  return (
    <Modal title="The Operation" subtitle="Each incision is a choice. The flesh will remember." onClose={close} width="max-w-2xl">
      <ChoiceGroup
        label="I. Join the limbs"
        value={limbs}
        onChange={setLimbs}
        options={[
          { value: "silk", title: "Fine silk sutures", detail: "Slow, meticulous work. The seams will hold and heal cleanly." },
          { value: "staples", title: "Iron staples", detail: "Fast and crude. The joins are rigid and will ache." },
        ]}
      />
      <ChoiceGroup
        label="II. Prepare the heart"
        value={heartPrep}
        onChange={setHeartPrep}
        options={[
          { value: "serum", title: "Flush with galvanic serum", detail: "Prime the muscle to carry the current before it is sewn in." },
          { value: "direct", title: "Install it as it is", detail: "Save the serum. The heart is strong enough... perhaps." },
        ]}
      />
      <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white/75">
        <span className="font-display uppercase tracking-[0.18em] text-parchment/80">III. Implant the brain</span>
        <p className="mt-1">
          You will implant the {brain === "scholar" ? <b className="text-white">brain of the scholar</b> : <b className="text-red-200">damaged, scarred brain</b>} you chose.
        </p>
      </div>
      <ChoiceGroup
        label="IV. The restraints"
        value={restraints}
        onChange={setRestraints}
        options={[
          { value: "loose", title: "Loosen the straps", detail: "Let it wake unbound. A gesture of trust, and a risk." },
          { value: "tight", title: "Tighten every buckle", detail: "Chain it down. Safer for you, if the straps hold." },
        ]}
      />
      <div className="flex justify-end gap-3">
        <PrimaryButton onClick={close}>Not yet</PrimaryButton>
        <PrimaryButton disabled={!limbs || !heartPrep || !restraints} onClick={() => limbs && heartPrep && restraints && apply({ limbs, heartPrep, restraints })}>
          Begin the operation
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function Slider({ label, unit, value, onChange, range, showRange }: { label: string; unit: string; value: number; onChange: (v: number) => void; range: [number, number]; showRange: boolean }) {
  return (
    <label className="mb-5 block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-sm uppercase tracking-[0.18em] text-parchment/80">{label}</span>
        <span className="font-mono text-lg text-gold tabular-nums">
          {value}
          <span className="ml-1 text-sm text-white/50">{unit}</span>
        </span>
      </div>
      <div className="relative">
        {showRange && (
          <div className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded bg-emerald-400/25 ring-1 ring-emerald-300/40" style={{ left: `${range[0]}%`, width: `${range[1] - range[0]}%` }} />
        )}
        <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="gothic-range relative w-full" />
      </div>
    </label>
  );
}

function CalibrationPanel() {
  const close = useGame((s) => s.closePanel);
  const apply = useGame((s) => s.applyCalibration);
  const existing = useGame((s) => s.choices.calibration);
  const journalRead = useGame((s) => s.choices.journalRead);
  const [cal, setCal] = useState<Calibration>(existing ?? { voltage: 40, frequency: 70, sedation: 10 });
  return (
    <Modal title="Neural Apparatus" subtitle="Brass dials, humming valves. The current must be coaxed, not forced." onClose={close}>
      {journalRead ? (
        <p className="mb-5 rounded-lg border border-emerald-300/20 bg-emerald-900/15 p-3 text-sm text-emerald-100/80">
          Your journal&apos;s ranges are marked on the dials in green.
        </p>
      ) : (
        <p className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white/65">
          You do not remember the exact ranges. Your anatomy journal is on the bench by the west wall, or you could ask the Advisor.
        </p>
      )}
      <Slider label="Voltage" unit="kV" value={cal.voltage} range={OPTIMAL_RANGES.voltage} showRange={journalRead} onChange={(voltage) => setCal({ ...cal, voltage })} />
      <Slider label="Frequency" unit="Hz" value={cal.frequency} range={OPTIMAL_RANGES.frequency} showRange={journalRead} onChange={(frequency) => setCal({ ...cal, frequency })} />
      <Slider label="Sedation" unit="%" value={cal.sedation} range={OPTIMAL_RANGES.sedation} showRange={journalRead} onChange={(sedation) => setCal({ ...cal, sedation })} />
      <div className="flex justify-end gap-3">
        <PrimaryButton onClick={close}>Cancel</PrimaryButton>
        <PrimaryButton onClick={() => apply(cal)}>Lock calibration</PrimaryButton>
      </div>
    </Modal>
  );
}

function JournalPanel() {
  const close = useGame((s) => s.closePanel);
  const read = useGame((s) => s.readJournal);
  const done = () => {
    read();
    close();
  };
  return (
    <Modal title="Anatomy Journal" subtitle="Ingolstadt, in your own cramped hand" onClose={done}>
      <div className="parchment-page space-y-3 rounded-md p-5 font-display text-[15px] leading-relaxed">
        <p>The galvanic apparatus must be tuned with patience. From my trials upon the frog and the ox:</p>
        <p>
          Voltage between <b>{OPTIMAL_RANGES.voltage[0]}</b> and <b>{OPTIMAL_RANGES.voltage[1]} kV</b>. Frequency between <b>{OPTIMAL_RANGES.frequency[0]}</b> and{" "}
          <b>{OPTIMAL_RANGES.frequency[1]} Hz</b>. Sedation between <b>{OPTIMAL_RANGES.sedation[0]}</b> and <b>{OPTIMAL_RANGES.sedation[1]}%</b>. Below that, the subject wakes in
          panic. Above it, the mind is dulled.
        </p>
        <p>Silk heals where iron festers. A heart primed with serum beats truer. A damaged brain may never master its own fear.</p>
        <p className="italic">And the last note, underlined twice: <u>it will look to me first. What I show it in that moment, it will become.</u></p>
      </div>
      <div className="mt-5 flex justify-end">
        <PrimaryButton onClick={done}>Close the journal</PrimaryButton>
      </div>
    </Modal>
  );
}

function ReportPanel() {
  const close = useGame((s) => s.closePanel);
  const c = useGame((s) => s.choices);
  const assembled = c.limbs !== null;
  return (
    <Modal title="The Body" subtitle="You lean over the table. Rain drums on the glass." onClose={close}>
      <div className="space-y-3 text-[15px] leading-relaxed text-white/85">
        {!assembled ? (
          <>
            <p>Eight feet of borrowed flesh. The torso is whole but the right arm is unattached, and the left leg sits a finger&apos;s width from its socket.</p>
            <p>The chest cavity is open and empty: it needs a heart. The skull is open too, waiting for a brain.</p>
            <p className="text-parchment/80">You will need: a heart, a brain, galvanic serum, a suture kit and your surgical tools. Then press F here to operate.</p>
          </>
        ) : (
          <>
            <p>
              The seams are {c.limbs === "silk" ? "fine and even" : "rough rows of iron staples"}. The chest rises faintly with no breath behind it. The straps are{" "}
              {c.restraints === "loose" ? "loose at its sides" : "buckled tight across its body"}.
            </p>
            <p>{c.calibration ? "The neural apparatus is calibrated. Only the lever remains." : "The neural apparatus at the console is not yet calibrated."}</p>
            {!c.spokeToCreature && <p className="text-parchment/80">Its face seems almost to listen. Perhaps you should speak to it (E).</p>}
          </>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <PrimaryButton onClick={close}>Step back</PrimaryButton>
      </div>
    </Modal>
  );
}

function AwakenPanel() {
  const close = useGame((s) => s.closePanel);
  const awaken = useGame((s) => s.awaken);
  const stats = useStats();
  const calibrated = useGame((s) => s.choices.calibration !== null);
  const rows: [string, number, number][] = [
    ["Body", stats.bodyStability, THRESHOLDS.bodyStability],
    ["Neural", stats.neuralStability, THRESHOLDS.neuralStability],
    ["Emotional", stats.emotionalStability, THRESHOLDS.emotionalStability],
    ["Trust", stats.creatureTrust, THRESHOLDS.creatureTrust],
  ];
  return (
    <Modal title="The Lever" subtitle="Your hand rests on cold iron. Thunder rolls over the mountains." onClose={close}>
      <p className="mb-4 text-[15px] text-white/80">Once the current flows, there is no undoing it. Are you ready to give it life, and to answer for it?</p>
      {!calibrated && <p className="mb-4 rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-100">The neural apparatus has not been calibrated.</p>}
      <div className="mb-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {rows.map(([label, value, threshold]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center">
            <div className="text-white/55">{label}</div>
            <div className={`font-mono text-xl ${value >= threshold ? "text-emerald-300" : "text-red-300"}`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <PrimaryButton onClick={close}>Not yet</PrimaryButton>
        <PrimaryButton danger onClick={awaken}>
          Pull the lever
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function InventoryPanel() {
  const close = useGame((s) => s.closePanel);
  const inventory = useGame((s) => s.inventory);
  const equipped = useGame((s) => s.equipped);
  const equip = useGame((s) => s.equip);
  return (
    <Modal title="Inventory" subtitle="What you carry in your coat and satchel" onClose={close}>
      {inventory.length === 0 ? (
        <p className="text-white/60">Your satchel is empty. Search the laboratory.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {inventory.map((id) => (
            <li key={id} className={`rounded-lg border p-3 ${equipped === id ? "border-gold bg-gold/10" : "border-white/15 bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{ITEMS[id].name}</span>
                {id === "surgical_tools" && (
                  <button type="button" onClick={() => equip(equipped === id ? null : id)} className="rounded border border-gold/50 px-2 py-0.5 text-xs text-gold hover:bg-gold/15">
                    {equipped === id ? "Equipped" : "Equip"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-snug text-white/60">{ITEMS[id].description}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 flex items-center gap-2 text-sm text-white/50">
        <KeyCap wide>Tab</KeyCap> or <KeyCap wide>Esc</KeyCap> to close
      </p>
    </Modal>
  );
}

export function Panels() {
  const panel = useGame((s) => s.panel);
  switch (panel) {
    case "assembly":
      return <AssemblyPanel />;
    case "calibration":
      return <CalibrationPanel />;
    case "journal":
      return <JournalPanel />;
    case "report":
      return <ReportPanel />;
    case "awaken":
      return <AwakenPanel />;
    case "inventory":
      return <InventoryPanel />;
    default:
      return null;
  }
}
