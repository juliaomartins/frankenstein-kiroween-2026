import * as THREE from "three";

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { c, ctx };
}

function speckle(ctx: CanvasRenderingContext2D, size: number, rand: () => number, count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const v = Math.floor(rand() * 255);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rand()})`;
    const s = 1 + rand() * 3;
    ctx.fillRect(rand() * size, rand() * size, s, s);
  }
}

function toTexture(c: HTMLCanvasElement, color: boolean) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface SurfaceSet {
  map: THREE.Texture;
  bumpMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

const cache = new Map<string, SurfaceSet | THREE.Texture>();

function memo<T extends SurfaceSet | THREE.Texture>(key: string, build: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const made = build();
  cache.set(key, made);
  return made;
}

export function stoneWall(): SurfaceSet {
  return memo("stoneWall", () => {
    const size = 512;
    const rand = rng(7);
    const color = canvas(size);
    const bump = canvas(size);
    const rough = canvas(size);
    color.ctx.fillStyle = "#1b1714";
    color.ctx.fillRect(0, 0, size, size);
    bump.ctx.fillStyle = "#000";
    bump.ctx.fillRect(0, 0, size, size);
    rough.ctx.fillStyle = "#ddd";
    rough.ctx.fillRect(0, 0, size, size);

    const rowH = size / 8;
    for (let row = 0; row < 8; row++) {
      let x = row % 2 ? -rowH * 0.9 : 0;
      while (x < size) {
        const w = rowH * (1.3 + rand() * 1.1);
        const mortar = 4;
        const shade = 38 + rand() * 30;
        const warm = rand() * 8;
        color.ctx.fillStyle = `rgb(${shade + warm},${shade + warm * 0.6},${shade - 4})`;
        color.ctx.fillRect(x + mortar, row * rowH + mortar, w - mortar * 2, rowH - mortar * 2);
        const g = 150 + rand() * 90;
        bump.ctx.fillStyle = `rgb(${g},${g},${g})`;
        bump.ctx.fillRect(x + mortar, row * rowH + mortar, w - mortar * 2, rowH - mortar * 2);
        const r = 150 + rand() * 80;
        rough.ctx.fillStyle = `rgb(${r},${r},${r})`;
        rough.ctx.fillRect(x + mortar, row * rowH + mortar, w - mortar * 2, rowH - mortar * 2);
        x += w;
      }
    }
    speckle(color.ctx, size, rand, 9000, 0.25);
    speckle(bump.ctx, size, rand, 6000, 0.35);
    for (let i = 0; i < 40; i++) {
      color.ctx.fillStyle = `rgba(20,30,18,${0.15 + rand() * 0.2})`;
      const x = rand() * size;
      color.ctx.fillRect(x, rand() * size, 2 + rand() * 4, 20 + rand() * 80);
    }
    return { map: toTexture(color.c, true), bumpMap: toTexture(bump.c, false), roughnessMap: toTexture(rough.c, false) };
  });
}

export function flagstoneFloor(): SurfaceSet {
  return memo("floor", () => {
    const size = 1024;
    const rand = rng(21);
    const color = canvas(size);
    const bump = canvas(size);
    const rough = canvas(size);
    color.ctx.fillStyle = "#0d0c0b";
    color.ctx.fillRect(0, 0, size, size);
    bump.ctx.fillStyle = "#000";
    bump.ctx.fillRect(0, 0, size, size);
    rough.ctx.fillStyle = "#fff";
    rough.ctx.fillRect(0, 0, size, size);

    const n = 6;
    const cell = size / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const gap = 6;
        const jx = (rand() - 0.5) * 8;
        const jy = (rand() - 0.5) * 8;
        const shade = 30 + rand() * 26;
        color.ctx.fillStyle = `rgb(${shade + 4},${shade + 2},${shade})`;
        color.ctx.fillRect(x * cell + gap + jx, y * cell + gap + jy, cell - gap * 2, cell - gap * 2);
        const g = 170 + rand() * 70;
        bump.ctx.fillStyle = `rgb(${g},${g},${g})`;
        bump.ctx.fillRect(x * cell + gap + jx, y * cell + gap + jy, cell - gap * 2, cell - gap * 2);
        const r = 70 + rand() * 90;
        rough.ctx.fillStyle = `rgb(${r},${r},${r})`;
        rough.ctx.fillRect(x * cell + gap + jx, y * cell + gap + jy, cell - gap * 2, cell - gap * 2);
      }
    }
    for (let i = 0; i < 26; i++) {
      const px = rand() * size;
      const py = rand() * size;
      const pr = 30 + rand() * 120;
      const grad = rough.ctx.createRadialGradient(px, py, 0, px, py, pr);
      grad.addColorStop(0, "rgba(10,10,10,0.95)");
      grad.addColorStop(1, "rgba(10,10,10,0)");
      rough.ctx.fillStyle = grad;
      rough.ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
    speckle(color.ctx, size, rand, 30000, 0.2);
    speckle(bump.ctx, size, rand, 20000, 0.3);
    return { map: toTexture(color.c, true), bumpMap: toTexture(bump.c, false), roughnessMap: toTexture(rough.c, false) };
  });
}

export function woodGrain(): THREE.Texture {
  return memo("wood", () => {
    const size = 256;
    const rand = rng(3);
    const { c, ctx } = canvas(size);
    ctx.fillStyle = "#3a2416";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 120; i++) {
      const y = rand() * size;
      ctx.strokeStyle = `rgba(${20 + rand() * 30},${10 + rand() * 15},${5},${0.25 + rand() * 0.35})`;
      ctx.lineWidth = 0.5 + rand() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3 * rand());
      ctx.stroke();
    }
    speckle(ctx, size, rand, 2000, 0.15);
    return toTexture(c, true);
  });
}

export function parchment(kind: "body" | "face" | "skeleton" | "notes"): THREE.Texture {
  return memo(`parchment-${kind}`, () => {
    const w = 256;
    const h = 360;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    const rand = rng(kind.length * 13);
    const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 240);
    grad.addColorStop(0, "#d8c49a");
    grad.addColorStop(1, "#8a6f45");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, rand, 1500, 0.12);
    ctx.strokeStyle = "rgba(50,30,15,0.85)";
    ctx.lineWidth = 2;
    const cx = w / 2;
    if (kind === "body" || kind === "skeleton") {
      ctx.beginPath();
      ctx.ellipse(cx, 60, 20, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 30, 95);
      ctx.lineTo(cx + 30, 95);
      ctx.lineTo(cx + 22, 190);
      ctx.lineTo(cx - 22, 190);
      ctx.closePath();
      ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * 30, 98);
        ctx.lineTo(cx + s * 55, 170);
        ctx.lineTo(cx + s * 62, 235);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + s * 14, 190);
        ctx.lineTo(cx + s * 20, 270);
        ctx.lineTo(cx + s * 22, 335);
        ctx.stroke();
      }
      if (kind === "skeleton") {
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.ellipse(cx, 110 + i * 11, 22 - i, 4, 0, 0, Math.PI);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = "rgba(120,30,20,0.6)";
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + (rand() - 0.5) * 40, 100 + rand() * 90);
          ctx.lineTo(cx + (rand() - 0.5) * 60, 120 + rand() * 120);
          ctx.stroke();
        }
      }
    } else if (kind === "face") {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 60, 70);
      ctx.lineTo(cx + 60, 70);
      ctx.lineTo(cx + 62, 230);
      ctx.quadraticCurveTo(cx, 300, cx - 62, 230);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 40, 140);
      ctx.lineTo(cx - 15, 140);
      ctx.moveTo(cx + 15, 140);
      ctx.lineTo(cx + 40, 140);
      ctx.moveTo(cx, 150);
      ctx.lineTo(cx - 6, 195);
      ctx.moveTo(cx - 25, 225);
      ctx.lineTo(cx + 25, 225);
      ctx.moveTo(cx - 60, 100);
      ctx.lineTo(cx + 60, 104);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 50 + i * 20, 96);
        ctx.lineTo(cx - 50 + i * 20, 108);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(50,30,15,0.7)";
    ctx.font = "italic 11px Georgia";
    for (let i = 0; i < (kind === "notes" ? 26 : 5); i++) {
      const y = kind === "notes" ? 24 + i * 13 : 20 + i * 12;
      let line = "";
      const len = 6 + Math.floor(rand() * 8);
      for (let j = 0; j < len; j++) line += "galvani vita nervus cor anima fulgur ".split(" ")[Math.floor(rand() * 6)] + " ";
      ctx.fillText(line, kind === "notes" ? 14 : w - 100, y);
    }
    return toTexture(c, true);
  });
}

export function stormSky(): THREE.Texture {
  return memo("sky", () => {
    const w = 1024;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    const rand = rng(99);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#05070f");
    grad.addColorStop(0.55, "#16233f");
    grad.addColorStop(1, "#0a1020");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const x = rand() * w;
      const y = rand() * h * 0.6;
      const r = 30 + rand() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(70,90,130,${0.08 + rand() * 0.1})`);
      g.addColorStop(1, "rgba(70,90,130,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.fillStyle = "#03050a";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.78 - Math.sin(x * 0.008) * 30 - rand() * 12);
    ctx.lineTo(w, h);
    ctx.fill();
    const castleX = w * 0.42;
    const baseY = h * 0.74;
    const spires = [
      [0, 120, 26],
      [-60, 80, 18],
      [60, 90, 20],
      [-110, 55, 14],
      [110, 60, 15],
      [-30, 70, 12],
      [30, 100, 14],
    ];
    for (const [dx, height, width] of spires) {
      const x = castleX + dx;
      ctx.fillRect(x - width / 2, baseY - height, width, height + 20);
      ctx.beginPath();
      ctx.moveTo(x - width / 2 - 3, baseY - height);
      ctx.lineTo(x, baseY - height - width * 2.2);
      ctx.lineTo(x + width / 2 + 3, baseY - height);
      ctx.fill();
    }
    ctx.fillRect(castleX - 130, baseY - 40, 260, 60);
    ctx.fillStyle = "rgba(255,190,90,0.8)";
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(castleX - 120 + rand() * 240, baseY - 30 - rand() * 80, 2, 3);
    }
    return toTexture(c, true);
  });
}

export function repeated(tex: THREE.Texture, x: number, y: number): THREE.Texture {
  const t = tex.clone();
  t.repeat.set(x, y);
  t.needsUpdate = true;
  return t;
}

export function repeatedSet(set: SurfaceSet, x: number, y: number): SurfaceSet {
  return {
    map: repeated(set.map, x, y),
    bumpMap: repeated(set.bumpMap, x, y),
    roughnessMap: repeated(set.roughnessMap, x, y),
  };
}

export function rugPattern(): THREE.Texture {
  return memo("rug", () => {
    const w = 512;
    const h = 320;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    const rand = rng(5);
    ctx.fillStyle = "#3d0d0e";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#7a5a2e";
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = "#1c2a3a";
    ctx.lineWidth = 6;
    ctx.strokeRect(34, 34, w - 68, h - 68);
    ctx.fillStyle = "#6b3a1c";
    for (let y = 60; y < h - 50; y += 40) {
      for (let x = 70; x < w - 60; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x + 12, y);
        ctx.lineTo(x, y + 12);
        ctx.lineTo(x - 12, y);
        ctx.fill();
      }
    }
    speckle(ctx, w, rand, 6000, 0.18);
    return toTexture(c, true);
  });
}

export function leadedGlass(): THREE.Texture {
  return memo("glass", () => {
    const size = 256;
    const { c, ctx } = canvas(size);
    ctx.fillStyle = "rgba(60,90,140,0.25)";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(8,8,10,1)";
    ctx.lineWidth = 5;
    const step = size / 4;
    for (let i = -4; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step + size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * step, size);
      ctx.lineTo(i * step + size, 0);
      ctx.stroke();
    }
    return toTexture(c, true);
  });
}
