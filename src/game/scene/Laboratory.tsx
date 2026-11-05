"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Interactable } from "./Interactable";
import { PILLAR_Z, ROOM, TABLE } from "./layout";
import { stormState } from "./stormState";
import { flagstoneFloor, leadedGlass, parchment, repeatedSet, rugPattern, stoneWall, stormSky } from "./textures";

interface WindowSpec {
  cx: number;
  bottom: number;
  w: number;
  h: number;
}

function gothicShape({ cx, bottom, w, h }: WindowSpec, scale = 1): THREE.Shape {
  const hw = (w / 2) * scale;
  const archH = w * 0.75 * scale;
  const top = bottom + h + (scale - 1) * w * 0.3;
  const b = bottom - (scale - 1) * w * 0.15;
  const spring = top - archH;
  const s = new THREE.Shape();
  s.moveTo(cx - hw, b);
  s.lineTo(cx + hw, b);
  s.lineTo(cx + hw, spring);
  s.quadraticCurveTo(cx + hw, spring + archH * 0.78, cx, top);
  s.quadraticCurveTo(cx - hw, spring + archH * 0.78, cx - hw, spring);
  s.lineTo(cx - hw, b);
  return s;
}

function wallGeometry(width: number, height: number, cap: number, windows: WindowSpec[]) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(width / 2, 0);
  s.lineTo(width / 2, height);
  if (cap > 0) {
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      const t = Math.PI * (i / steps);
      s.lineTo((width / 2) * Math.cos(t), height + cap * Math.sin(t));
    }
  } else {
    s.lineTo(-width / 2, height);
  }
  s.lineTo(-width / 2, 0);
  s.holes = windows.map((w) => gothicShape(w));
  return new THREE.ShapeGeometry(s, 24);
}

function useStone(repeatX: number, repeatY: number) {
  return useMemo(() => {
    const set = repeatedSet(stoneWall(), repeatX, repeatY);
    return new THREE.MeshStandardMaterial({
      map: set.map,
      bumpMap: set.bumpMap,
      bumpScale: 2.2,
      roughnessMap: set.roughnessMap,
      roughness: 0.95,
      color: "#b9ada0",
    });
  }, [repeatX, repeatY]);
}

function StormWindow({ spec, depth = 0.35 }: { spec: WindowSpec; depth?: number }) {
  const skyRef = useRef<THREE.MeshBasicMaterial>(null);
  const glassRef = useRef<THREE.MeshStandardMaterial>(null);
  const surroundMat = useStone(0.35, 0.35);
  const geoms = useMemo(() => {
    const outer = gothicShape(spec, 1.14);
    outer.holes = [gothicShape(spec)];
    const surround = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: 20 });
    const glass = new THREE.ShapeGeometry(gothicShape(spec), 20);
    const uv = glass.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.9, uv.getY(i) * 0.9);
    const sky = new THREE.PlaneGeometry(spec.w * 2.6, spec.h * 1.6);
    return { surround, glass, sky };
  }, [spec, depth]);
  const glassTex = useMemo(() => leadedGlass(), []);
  const skyTex = useMemo(() => stormSky(), []);

  useFrame(() => {
    const f = stormState.flash;
    if (skyRef.current) skyRef.current.color.setScalar(0.55 + f * 2.8);
    if (glassRef.current) glassRef.current.emissiveIntensity = 0.25 + f * 2.2;
  });

  return (
    <group>
      <mesh geometry={geoms.surround} material={surroundMat} position={[0, 0, -depth / 2]} />
      <mesh geometry={geoms.glass} position={[0, 0, -0.05]}>
        <meshStandardMaterial
          ref={glassRef}
          map={glassTex}
          transparent
          opacity={0.85}
          roughness={0.08}
          metalness={0.2}
          color="#3d5683"
          emissive="#4a6aa8"
          emissiveMap={glassTex}
          emissiveIntensity={0.25}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geoms.sky} position={[spec.cx, spec.bottom + spec.h * 0.55, -1.4]}>
        <meshBasicMaterial ref={skyRef} map={skyTex} toneMapped={false} />
      </mesh>
      <mesh position={[spec.cx, spec.bottom - 0.08, 0.12]}>
        <boxGeometry args={[spec.w * 1.25, 0.16, 0.5]} />
        <primitive object={surroundMat} attach="material" />
      </mesh>
    </group>
  );
}

const BACK_WINDOW: WindowSpec = { cx: 0, bottom: 1.3, w: 3.6, h: 5.6 };
const SIDE_WINDOWS_LEFT: WindowSpec[] = [{ cx: 2.2, bottom: 1.35, w: 2.1, h: 3.05 }];
const SIDE_WINDOWS_RIGHT: WindowSpec[] = [{ cx: 6.2, bottom: 1.35, w: 2.1, h: 3.05 }];

function Floor() {
  const width = ROOM.maxX - ROOM.minX;
  const depth = ROOM.maxZ - ROOM.minZ;
  const set = useMemo(() => repeatedSet(flagstoneFloor(), width / 4, depth / 4), [width, depth]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (ROOM.minZ + ROOM.maxZ) / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <MeshReflectorMaterial
        map={set.map}
        bumpMap={set.bumpMap}
        bumpScale={1.5}
        roughnessMap={set.roughnessMap}
        roughness={0.9}
        metalness={0.35}
        color="#8f8780"
        blur={[400, 120]}
        resolution={512}
        mixBlur={0.9}
        mixStrength={3.2}
        mixContrast={1.15}
        depthScale={0.8}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        mirror={0.6}
      />
    </mesh>
  );
}

function Vault() {
  const length = ROOM.maxZ - ROOM.minZ;
  const halfW = (ROOM.maxX - ROOM.minX) / 2;
  const mat = useMemo(() => {
    const set = repeatedSet(stoneWall(), 9, 6);
    return new THREE.MeshStandardMaterial({
      map: set.map,
      bumpMap: set.bumpMap,
      bumpScale: 2,
      roughness: 1,
      color: "#857a70",
      side: THREE.BackSide,
    });
  }, []);
  const ribMat = useStone(1, 0.2);
  return (
    <group position={[0, ROOM.wallHeight, (ROOM.minZ + ROOM.maxZ) / 2]} scale={[1, ROOM.vaultRise / halfW, 1]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[halfW, halfW, length, 40, 1, true, Math.PI / 2, Math.PI]} />
      </mesh>
      {PILLAR_Z.map((z) => (
        <mesh key={z} position={[0, 0, z - (ROOM.minZ + ROOM.maxZ) / 2]} material={ribMat}>
          <torusGeometry args={[halfW - 0.15, 0.22, 8, 48, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
}

function Pillars() {
  const mat = useStone(0.4, 1.6);
  return (
    <group>
      {PILLAR_Z.flatMap((z) =>
        [ROOM.minX + 0.28, ROOM.maxX - 0.28].map((x) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, ROOM.wallHeight / 2, 0]} material={mat} castShadow>
              <boxGeometry args={[0.56, ROOM.wallHeight, 0.62]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={mat}>
              <boxGeometry args={[0.75, 0.5, 0.8]} />
            </mesh>
            <mesh position={[0, ROOM.wallHeight - 0.12, 0]} material={mat}>
              <boxGeometry args={[0.8, 0.24, 0.86]} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

function Posters() {
  const items: { kind: "body" | "face" | "skeleton" | "notes"; pos: [number, number, number]; rot: number; s: number }[] = [
    { kind: "body", pos: [-4.6, 3.1, ROOM.minZ + 0.03], rot: 0, s: 1 },
    { kind: "face", pos: [4.6, 3.1, ROOM.minZ + 0.03], rot: 0, s: 1 },
    { kind: "skeleton", pos: [ROOM.minX + 0.03, 2.6, -1.6], rot: Math.PI / 2, s: 0.9 },
    { kind: "notes", pos: [ROOM.maxX - 0.03, 2.5, 2.9], rot: -Math.PI / 2, s: 0.8 },
    { kind: "body", pos: [ROOM.maxX - 0.03, 2.8, -1.2], rot: -Math.PI / 2, s: 0.9 },
    { kind: "face", pos: [ROOM.minX + 0.03, 2.8, -9.2], rot: Math.PI / 2, s: 0.8 },
  ];
  return (
    <group>
      {items.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rot, (i % 2 ? 1 : -1) * 0.02]}>
          <planeGeometry args={[1.0 * p.s, 1.4 * p.s]} />
          <meshStandardMaterial map={parchment(p.kind)} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Door() {
  return (
    <group position={[0, 0, ROOM.maxZ - 0.05]}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2.0, 3.0, 0.15]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.85} />
      </mesh>
      {[-0.55, 0, 0.55].map((x) => (
        <mesh key={x} position={[x, 1.5, -0.09]}>
          <boxGeometry args={[0.06, 2.9, 0.04]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function Laboratory() {
  const width = ROOM.maxX - ROOM.minX;
  const depth = ROOM.maxZ - ROOM.minZ;
  const centerZ = (ROOM.minZ + ROOM.maxZ) / 2;
  const endMat = useStone(1 / 2.5, 1 / 2.5);
  const sideMat = endMat;
  const geoms = useMemo(
    () => ({
      back: wallGeometry(width, ROOM.wallHeight, ROOM.vaultRise, [BACK_WINDOW]),
      front: wallGeometry(width, ROOM.wallHeight, ROOM.vaultRise, []),
      left: wallGeometry(depth, ROOM.wallHeight, 0, SIDE_WINDOWS_LEFT),
      right: wallGeometry(depth, ROOM.wallHeight, 0, SIDE_WINDOWS_RIGHT),
    }),
    [width, depth],
  );
  const rugTex = useMemo(() => rugPattern(), []);

  return (
    <group>
      <Floor />
      <mesh geometry={geoms.back} material={endMat} position={[0, 0, ROOM.minZ]} receiveShadow />
      <mesh geometry={geoms.front} material={endMat} position={[0, 0, ROOM.maxZ]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={geoms.left} material={sideMat} position={[ROOM.minX, 0, centerZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      <mesh geometry={geoms.right} material={sideMat} position={[ROOM.maxX, 0, centerZ]} rotation={[0, -Math.PI / 2, 0]} receiveShadow />
      <Vault />
      <Pillars />
      <Posters />
      <Door />

      <Interactable id="window" position={[0, 0, ROOM.minZ]}>
        <StormWindow spec={BACK_WINDOW} />
      </Interactable>
      <group position={[ROOM.minX, 0, centerZ]} rotation={[0, Math.PI / 2, 0]}>
        {SIDE_WINDOWS_LEFT.map((w) => (
          <StormWindow key={w.cx} spec={w} />
        ))}
      </group>
      <group position={[ROOM.maxX, 0, centerZ]} rotation={[0, -Math.PI / 2, 0]}>
        {SIDE_WINDOWS_RIGHT.map((w) => (
          <StormWindow key={w.cx} spec={w} />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TABLE.x, 0.012, TABLE.z + 2.6]} receiveShadow>
        <planeGeometry args={[3.6, 2.2]} />
        <meshStandardMaterial map={rugTex} roughness={1} />
      </mesh>
    </group>
  );
}
