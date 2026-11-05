let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let masterVolume = 0.8;

export function setMasterVolume(volume: number) {
  masterVolume = Math.min(1, Math.max(0, volume));
  if (master && ctx) master.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.05);
}

function makeNoise(context: AudioContext): AudioBuffer {
  const length = context.sampleRate * 4;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function noiseSource(): AudioBufferSourceNode | null {
  if (!ctx || !noiseBuffer) return null;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  return src;
}

export function initAudio() {
  if (typeof window === "undefined") return;
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = masterVolume;
  master.connect(ctx.destination);
  noiseBuffer = makeNoise(ctx);

  const rain = noiseSource();
  if (rain) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 600;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5000;
    const g = ctx.createGain();
    g.gain.value = 0.09;
    rain.connect(hp).connect(lp).connect(g).connect(master);
    rain.start();
  }

  const hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 55;
  const humFilter = ctx.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 180;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.018;
  hum.connect(humFilter).connect(humGain).connect(master);
  hum.start();
}

export function thunder(strength = 1) {
  if (!ctx || !master) return;
  const src = noiseSource();
  if (!src) return;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 160 + strength * 140;
  const g = ctx.createGain();
  const t = ctx.currentTime + 0.4 + Math.random() * 1.2;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.9 * strength, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.25 * strength, t + 0.9);
  g.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
  src.connect(lp).connect(g).connect(master);
  src.start(t, Math.random() * 3);
  src.stop(t + 5);
}

export function crackle(duration = 0.25, volume = 0.25) {
  if (!ctx || !master) return;
  const src = noiseSource();
  if (!src) return;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  for (let i = 0; i < 8; i++) {
    const at = t + Math.random() * duration;
    g.gain.setValueAtTime(volume * Math.random(), at);
    g.gain.setValueAtTime(0, at + 0.02);
  }
  src.connect(hp).connect(g).connect(master);
  src.start(t);
  src.stop(t + duration + 0.05);
}

export function chime() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  [523, 784].forEach((f, i) => {
    const o = ctx!.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0, t + i * 0.08);
    g.gain.linearRampToValueAtTime(0.08, t + i * 0.08 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.8);
    o.connect(g).connect(master!);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.9);
  });
}

export function roar() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(90, t);
  o.frequency.linearRampToValueAtTime(60, t + 1.6);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
  o.connect(lp).connect(g).connect(master);
  o.start(t);
  o.stop(t + 1.9);
  const n = noiseSource();
  if (n) {
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.4, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 400;
    n.connect(bp).connect(ng).connect(master);
    n.start(t);
    n.stop(t + 1.6);
  }
}

export function heartbeat() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  [0, 0.28].forEach((d) => {
    const o = ctx!.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(60, t + d);
    o.frequency.exponentialRampToValueAtTime(35, t + d + 0.15);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.5, t + d);
    g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.2);
    o.connect(g).connect(master!);
    o.start(t + d);
    o.stop(t + d + 0.25);
  });
}
