#!/usr/bin/env node
// Shrinks GLB models for the web: re-encodes textures as WebP (EXT_texture_webp), caps their size,
// optionally drops meshes by material, and prunes everything left unreferenced.
// Usage: node scripts/optimize-models.mjs
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const JOBS = [
  {
    file: "public/models/frankenstein.glb",
    colorMax: 2048,
    dataMax: 1024,
    quality: 82,
    dropMeshesWithMaterial: [],
  },
  {
    file: "public/models/player-hands.glb",
    colorMax: 1024,
    dataMax: 1024,
    quality: 85,
    dropMeshesWithMaterial: ["blinn1"],
    dropAnimationUnder: "GLOBAL_MAIN_CONTROL_R1",
    // Must match IDLE_TIME and GRIP_TIME in src/game/scene/handsRig.ts.
    bakeAnimationTimes: [2, 8],
  },
];

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

function readGlb(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${path} is not a GLB file`);
  let offset = 12;
  let json = null;
  let bin = Buffer.alloc(0);
  while (offset < buf.length) {
    const length = buf.readUInt32LE(offset);
    const type = buf.readUInt32LE(offset + 4);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === CHUNK_JSON) json = JSON.parse(data.toString("utf8"));
    if (type === CHUNK_BIN) bin = data;
    offset += 8 + length;
  }
  return { json, bin, size: buf.length };
}

function pad4(buf, fill) {
  const rem = buf.length % 4;
  return rem ? Buffer.concat([buf, Buffer.alloc(4 - rem, fill)]) : buf;
}

function writeGlb(path, json, bin) {
  const jsonBuf = pad4(Buffer.from(JSON.stringify(json), "utf8"), 0x20);
  const binBuf = pad4(bin, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);
  const jsonHead = Buffer.alloc(8);
  jsonHead.writeUInt32LE(jsonBuf.length, 0);
  jsonHead.writeUInt32LE(CHUNK_JSON, 4);
  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(binBuf.length, 0);
  binHead.writeUInt32LE(CHUNK_BIN, 4);
  const out = Buffer.concat([header, jsonHead, jsonBuf, binHead, binBuf]);
  writeFileSync(path, out);
  return out.length;
}

function textureRefs(material) {
  const refs = [];
  const walk = (obj, key) => {
    if (!obj || typeof obj !== "object") return;
    if (key && /texture$/i.test(key) && typeof obj.index === "number") refs.push({ key, ref: obj });
    for (const [k, v] of Object.entries(obj)) walk(v, k);
  };
  walk(material, "");
  return refs;
}

function remap(list, keep) {
  const map = new Map();
  const next = [];
  list.forEach((item, i) => {
    if (keep.has(i)) {
      map.set(i, next.length);
      next.push(item);
    }
  });
  return { next, map };
}

function prune(json) {
  const usedMeshes = new Set();
  const usedSkins = new Set();
  for (const n of json.nodes ?? []) {
    if (n.mesh !== undefined) usedMeshes.add(n.mesh);
    if (n.skin !== undefined) usedSkins.add(n.skin);
  }
  const meshes = remap(json.meshes ?? [], usedMeshes);
  const skins = remap(json.skins ?? [], usedSkins);
  for (const n of json.nodes ?? []) {
    if (n.mesh !== undefined) n.mesh = meshes.map.get(n.mesh);
    if (n.skin !== undefined) n.skin = skins.map.get(n.skin);
  }
  json.meshes = meshes.next;
  json.skins = skins.next;

  const usedMaterials = new Set();
  for (const m of json.meshes) for (const p of m.primitives) if (p.material !== undefined) usedMaterials.add(p.material);
  const materials = remap(json.materials ?? [], usedMaterials);
  for (const m of json.meshes) for (const p of m.primitives) if (p.material !== undefined) p.material = materials.map.get(p.material);
  json.materials = materials.next;

  const usedTextures = new Set();
  for (const m of json.materials) for (const { ref } of textureRefs(m)) usedTextures.add(ref.index);
  const textures = remap(json.textures ?? [], usedTextures);
  for (const m of json.materials) for (const { ref } of textureRefs(m)) ref.index = textures.map.get(ref.index);
  json.textures = textures.next;

  const imageOf = (t) => t.extensions?.EXT_texture_webp?.source ?? t.source;
  const usedImages = new Set(json.textures.map(imageOf).filter((i) => i !== undefined));
  const images = remap(json.images ?? [], usedImages);
  for (const t of json.textures) {
    if (t.source !== undefined) t.source = images.map.get(t.source);
    if (t.extensions?.EXT_texture_webp) t.extensions.EXT_texture_webp.source = images.map.get(t.extensions.EXT_texture_webp.source);
  }
  json.images = images.next;

  const usedSamplers = new Set(json.textures.map((t) => t.sampler).filter((s) => s !== undefined));
  const samplers = remap(json.samplers ?? [], usedSamplers);
  for (const t of json.textures) if (t.sampler !== undefined) t.sampler = samplers.map.get(t.sampler);
  json.samplers = samplers.next;

  const usedAccessors = new Set();
  for (const m of json.meshes) {
    for (const p of m.primitives) {
      Object.values(p.attributes).forEach((a) => usedAccessors.add(a));
      if (p.indices !== undefined) usedAccessors.add(p.indices);
      for (const t of p.targets ?? []) Object.values(t).forEach((a) => usedAccessors.add(a));
    }
  }
  for (const s of json.skins) if (s.inverseBindMatrices !== undefined) usedAccessors.add(s.inverseBindMatrices);
  for (const a of json.animations ?? []) for (const s of a.samplers) {
    usedAccessors.add(s.input);
    usedAccessors.add(s.output);
  }
  const accessors = remap(json.accessors ?? [], usedAccessors);
  const fixAccessor = (i) => accessors.map.get(i);
  for (const m of json.meshes) {
    for (const p of m.primitives) {
      for (const k of Object.keys(p.attributes)) p.attributes[k] = fixAccessor(p.attributes[k]);
      if (p.indices !== undefined) p.indices = fixAccessor(p.indices);
      for (const t of p.targets ?? []) for (const k of Object.keys(t)) t[k] = fixAccessor(t[k]);
    }
  }
  for (const s of json.skins) if (s.inverseBindMatrices !== undefined) s.inverseBindMatrices = fixAccessor(s.inverseBindMatrices);
  for (const a of json.animations ?? []) for (const s of a.samplers) {
    s.input = fixAccessor(s.input);
    s.output = fixAccessor(s.output);
  }
  json.accessors = accessors.next;
}

const FLOAT = 5126;
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function readFloats(json, viewData, index) {
  const a = json.accessors[index];
  if (a.componentType !== FLOAT) throw new Error(`accessor ${index} is not float`);
  const n = COMPONENTS[a.type];
  const view = json.bufferViews[a.bufferView];
  const data = viewData[a.bufferView];
  const stride = view.byteStride ?? n * 4;
  const out = new Float32Array(a.count * n);
  for (let i = 0; i < a.count; i++) {
    for (let c = 0; c < n; c++) out[i * n + c] = data.readFloatLE((a.byteOffset ?? 0) + i * stride + c * 4);
  }
  return { values: out, n };
}

function addFloatAccessor(json, viewData, values, type) {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((v, i) => bytes.writeFloatLE(v, i * 4));
  json.bufferViews.push({ buffer: 0, byteOffset: 0, byteLength: bytes.length });
  viewData.push(bytes);
  const n = COMPONENTS[type];
  const min = Array.from({ length: n }, (_, c) => Math.min(...values.filter((_, i) => i % n === c)));
  const max = Array.from({ length: n }, (_, c) => Math.max(...values.filter((_, i) => i % n === c)));
  json.accessors.push({ bufferView: json.bufferViews.length - 1, componentType: FLOAT, count: values.length / n, type, min, max });
  return json.accessors.length - 1;
}

function sampleAt(input, output, n, time, isRotation) {
  const keys = input.values;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1] < time) i++;
  const j = Math.min(i + 1, keys.length - 1);
  const span = keys[j] - keys[i];
  const t = span > 0 ? Math.min(1, Math.max(0, (time - keys[i]) / span)) : 0;
  const a = output.values.subarray(i * n, i * n + n);
  const b = output.values.subarray(j * n, j * n + n);
  const sign = isRotation && a.reduce((s, v, k) => s + v * b[k], 0) < 0 ? -1 : 1;
  const v = Array.from(a, (x, k) => x + (b[k] * sign - x) * t);
  if (isRotation) {
    const len = Math.hypot(...v) || 1;
    return v.map((x) => x / len);
  }
  return v;
}

function bakeAnimations(json, viewData, job) {
  if (!job.bakeAnimationTimes && !job.dropAnimationUnder) return;
  const parent = new Map();
  json.nodes.forEach((n, i) => (n.children ?? []).forEach((c) => parent.set(c, i)));
  const under = (i, name) => {
    for (let k = i; k !== undefined; k = parent.get(k)) if (json.nodes[k].name === name) return true;
    return false;
  };
  for (const anim of json.animations ?? []) {
    if (job.dropAnimationUnder) {
      const keep = anim.channels.filter((c) => !under(c.target.node, job.dropAnimationUnder));
      const usedSamplers = new Set(keep.map((c) => c.sampler));
      const samplers = remap(anim.samplers, usedSamplers);
      keep.forEach((c) => (c.sampler = samplers.map.get(c.sampler)));
      anim.channels = keep;
      anim.samplers = samplers.next;
    }
    if (!job.bakeAnimationTimes) continue;
    const times = job.bakeAnimationTimes;
    const input = addFloatAccessor(json, viewData, times, "SCALAR");
    anim.samplers.forEach((sampler, si) => {
      if ((sampler.interpolation ?? "LINEAR") !== "LINEAR") throw new Error("only LINEAR samplers can be baked");
      const channel = anim.channels.find((c) => c.sampler === si);
      const inValues = readFloats(json, viewData, sampler.input);
      const outValues = readFloats(json, viewData, sampler.output);
      const isRotation = channel?.target.path === "rotation";
      const baked = times.flatMap((t) => sampleAt(inValues, outValues, outValues.n, t, isRotation));
      sampler.input = input;
      sampler.output = addFloatAccessor(json, viewData, baked, json.accessors[sampler.output].type);
    });
  }
}

async function encodeImage(data, maxSize, quality) {
  const img = sharp(data);
  const meta = await img.metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const pipeline = longest > maxSize ? img.resize({ width: maxSize, height: maxSize, fit: "inside" }) : img;
  return pipeline.webp({ quality, alphaQuality: 90, effort: 5 }).toBuffer();
}

async function optimize(job) {
  const { json, bin, size } = readGlb(job.file);
  const viewData = (json.bufferViews ?? []).map((v) => bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));

  if (job.dropMeshesWithMaterial.length) {
    const dropMaterials = new Set(json.materials.flatMap((m, i) => (job.dropMeshesWithMaterial.includes(m.name) ? [i] : [])));
    const dropMeshes = new Set(json.meshes.flatMap((m, i) => (m.primitives.every((p) => dropMaterials.has(p.material)) ? [i] : [])));
    for (const n of json.nodes) {
      if (n.mesh !== undefined && dropMeshes.has(n.mesh)) {
        delete n.mesh;
        delete n.skin;
      }
    }
  }
  bakeAnimations(json, viewData, job);
  prune(json);

  const colorImages = new Set();
  for (const m of json.materials) {
    for (const { key, ref } of textureRefs(m)) {
      const t = json.textures[ref.index];
      const img = t.extensions?.EXT_texture_webp?.source ?? t.source;
      if (/basecolor|emissive|diffuse/i.test(key)) colorImages.add(img);
    }
  }

  for (const [i, image] of json.images.entries()) {
    const encoded = await encodeImage(viewData[image.bufferView], colorImages.has(i) ? job.colorMax : job.dataMax, job.quality);
    viewData[image.bufferView] = encoded;
    image.mimeType = "image/webp";
  }
  for (const t of json.textures) {
    const source = t.extensions?.EXT_texture_webp?.source ?? t.source;
    t.extensions = { ...(t.extensions ?? {}), EXT_texture_webp: { source } };
    delete t.source;
  }
  for (const key of ["extensionsUsed", "extensionsRequired"]) {
    json[key] = Array.from(new Set([...(json[key] ?? []), "EXT_texture_webp"]));
  }

  const usedViews = new Set([...json.accessors.map((a) => a.bufferView), ...json.images.map((im) => im.bufferView)].filter((v) => v !== undefined));
  const views = remap(json.bufferViews, usedViews);
  for (const a of json.accessors) if (a.bufferView !== undefined) a.bufferView = views.map.get(a.bufferView);
  for (const im of json.images) im.bufferView = views.map.get(im.bufferView);

  const chunks = [];
  let offset = 0;
  json.bufferViews = views.next.map((v, newIndex) => {
    const oldIndex = [...views.map.entries()].find(([, n]) => n === newIndex)[0];
    const data = viewData[oldIndex];
    const view = { ...v, byteOffset: offset, byteLength: data.length };
    chunks.push(pad4(data, 0));
    offset += pad4(data, 0).length;
    return view;
  });
  json.buffers = [{ byteLength: offset }];

  const out = writeGlb(job.file, json, Buffer.concat(chunks));
  const mb = (n) => (n / 1048576).toFixed(1);
  console.log(`${job.file}: ${mb(size)} MB -> ${mb(out)} MB (${json.images.length} WebP textures, ${json.meshes.length} meshes)`);
}

for (const job of JOBS) await optimize(job);
