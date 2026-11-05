"use client";

import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ItemId } from "../logic/types";
import { useGame } from "../state/gameStore";
import { Interactable } from "./Interactable";
import { PLACES, ROOM } from "./layout";
import { parchment, woodGrain } from "./textures";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ironMat = new THREE.MeshStandardMaterial({ color: "#2b2826", metalness: 0.8, roughness: 0.5 });
const glassMat = new THREE.MeshPhysicalMaterial({
  color: "#cfe3dc",
  roughness: 0.05,
  metalness: 0,
  transparent: true,
  opacity: 0.28,
  depthWrite: false,
});

function useWood(color = "#5a3d29") {
  return useMemo(() => new THREE.MeshStandardMaterial({ map: woodGrain(), color, roughness: 0.78 }), [color]);
}

export function Bench({ position, length, rotation = 0, depth = 1.1 }: { position: [number, number, number]; length: number; rotation?: number; depth?: number }) {
  const wood = useWood();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.9, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[length, 0.1, depth]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (length / 2 - 0.1), 0.43, sz * (depth / 2 - 0.1)]} material={wood} castShadow>
            <boxGeometry args={[0.12, 0.86, 0.12]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.25, 0]} material={wood}>
        <boxGeometry args={[length - 0.3, 0.05, depth - 0.25]} />
      </mesh>
    </group>
  );
}

const BOTTLE_COLORS = ["#2f4a2a", "#5a3a1a", "#1f3346", "#6a5a2a", "#3a1f1f", "#244a3f"];
const BOOK_COLORS = ["#4a1a14", "#2a2a40", "#3d2a18", "#1f3326", "#5a4026", "#2a1810"];

export function ShelfUnit({ position, rotation = 0, width = 3, height = 3.2, seed = 1 }: { position: [number, number, number]; rotation?: number; width?: number; height?: number; seed?: number }) {
  const wood = useWood("#3e2a1c");
  const levels = 4;
  const { bottles, books } = useMemo(() => {
    const r = rng(seed * 997);
    const bottles: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
    const books: { p: [number, number, number]; s: [number, number, number]; c: string; rz: number }[] = [];
    for (let l = 0; l < levels; l++) {
      const y = 0.45 + l * (height / levels);
      let x = -width / 2 + 0.12;
      while (x < width / 2 - 0.15) {
        if (r() < 0.55) {
          const h = 0.18 + r() * 0.22;
          const rad = 0.04 + r() * 0.04;
          bottles.push({ p: [x + rad, y + h / 2, (r() - 0.5) * 0.15], s: [rad, h, rad], c: BOTTLE_COLORS[Math.floor(r() * BOTTLE_COLORS.length)] });
          x += rad * 2 + 0.04 + r() * 0.06;
        } else {
          const n = 2 + Math.floor(r() * 5);
          for (let i = 0; i < n && x < width / 2 - 0.15; i++) {
            const h = 0.22 + r() * 0.12;
            const t = 0.04 + r() * 0.03;
            books.push({ p: [x + t / 2, y + h / 2, 0], s: [t, h, 0.2 + r() * 0.05], c: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)], rz: i === n - 1 && r() < 0.3 ? 0.25 : 0 });
            x += t + 0.005;
          }
          x += 0.05;
        }
      }
    }
    return { bottles, books };
  }, [seed, width, height]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: levels + 1 }, (_, l) => (
        <mesh key={l} position={[0, 0.4 + l * (height / levels) - 0.03, 0]} material={wood} receiveShadow>
          <boxGeometry args={[width, 0.05, 0.4]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2), height / 2 + 0.2, 0]} material={wood} castShadow>
          <boxGeometry args={[0.07, height + 0.4, 0.42]} />
        </mesh>
      ))}
      <Instances limit={bottles.length} castShadow>
        <cylinderGeometry args={[1, 1, 1, 10]} />
        <meshStandardMaterial roughness={0.15} metalness={0.1} transparent opacity={0.85} />
        {bottles.map((b, i) => (
          <Instance key={i} position={b.p} scale={b.s} color={b.c} />
        ))}
      </Instances>
      <Instances limit={books.length}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.85} />
        {books.map((b, i) => (
          <Instance key={i} position={b.p} scale={b.s} rotation={[0, 0, b.rz]} color={b.c} />
        ))}
      </Instances>
    </group>
  );
}

export function Candle({ position, height = 0.22, light = false }: { position: [number, number, number]; height?: number; light?: boolean }) {
  const flame = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const seed = useMemo(() => Math.random() * 100, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const f = 0.85 + Math.sin(t * 9) * 0.07 + Math.sin(t * 17.3) * 0.05 + Math.random() * 0.05;
    if (flame.current) flame.current.scale.set(1, f, 1);
    if (lightRef.current) lightRef.current.intensity = 4 * f;
  });
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.028, 0.032, height, 10]} />
        <meshStandardMaterial color="#e8dcc0" roughness={0.6} emissive="#ffb060" emissiveIntensity={0.08} />
      </mesh>
      <mesh ref={flame} position={[0, height + 0.035, 0]}>
        <coneGeometry args={[0.014, 0.06, 8]} />
        <meshBasicMaterial color={new THREE.Color("#ffb347").multiplyScalar(5)} toneMapped={false} />
      </mesh>
      {light && <pointLight ref={lightRef} position={[0, height + 0.15, 0]} color="#ffaa55" distance={6} decay={1.6} intensity={4} />}
    </group>
  );
}

export function Candelabra({ position, lit = true }: { position: [number, number, number]; lit?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} material={ironMat}>
        <cylinderGeometry args={[0.02, 0.07, 0.24, 10]} />
      </mesh>
      <mesh position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]} material={ironMat}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
      </mesh>
      <Candle position={[-0.14, 0.24, 0]} height={0.16} />
      <Candle position={[0, 0.24, 0]} height={0.2} light={lit} />
      <Candle position={[0.14, 0.24, 0]} height={0.14} />
    </group>
  );
}

export function Lantern({ position, intensity = 8 }: { position: [number, number, number]; intensity?: number }) {
  const light = useRef<THREE.PointLight>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    if (light.current) light.current.intensity = intensity * (0.9 + Math.sin(t * 5.1) * 0.05 + Math.random() * 0.05);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} material={ironMat}>
        <cylinderGeometry args={[0.1, 0.12, 0.06, 12]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={glassMat}>
        <cylinderGeometry args={[0.08, 0.09, 0.24, 12]} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshBasicMaterial color={new THREE.Color("#ffb04a").multiplyScalar(6)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.33, 0]} material={ironMat}>
        <coneGeometry args={[0.1, 0.08, 12]} />
      </mesh>
      <mesh position={[0, 0.41, 0]} material={ironMat}>
        <torusGeometry args={[0.04, 0.008, 6, 12]} />
      </mesh>
      <pointLight ref={light} position={[0, 0.2, 0]} color="#ff9f45" distance={7} decay={1.7} intensity={intensity} />
    </group>
  );
}

export function Skull({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.1, 0]} scale={[0.9, 0.95, 1.1]} castShadow>
        <sphereGeometry args={[0.1, 18, 14]} />
        <meshStandardMaterial color="#d6c8a8" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.03, 0.05]} scale={[0.75, 0.5, 0.8]}>
        <sphereGeometry args={[0.08, 12, 10]} />
        <meshStandardMaterial color="#cbbd9c" roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.035, 0.09, 0.088]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color="#0a0806" />
        </mesh>
      ))}
    </group>
  );
}

export function Jar({ position, liquid = "#3cff6a", glow = 2.2, scale = 1, contents }: { position: [number, number, number]; liquid?: string; glow?: number; scale?: number; contents?: React.ReactNode }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} material={glassMat}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 20]} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.122, 0.122, 0.32, 20]} />
        <meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={glow} transparent opacity={0.7} roughness={0.1} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.05, 16]} />
        <meshStandardMaterial color="#5a4a30" metalness={0.6} roughness={0.4} />
      </mesh>
      {contents}
    </group>
  );
}

function Brain({ damaged }: { damaged?: boolean }) {
  const geom = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.075, 4);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 140) * Math.sin(v.y * 120) * Math.sin(v.z * 130);
      v.multiplyScalar(1 + n * 0.08);
      v.x *= 1.15;
      pos.setXYZ(i, v.x, v.y * 0.8, v.z * 1.2);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geom} position={[0, 0.18, 0]}>
      <meshStandardMaterial color={damaged ? "#6d4a4a" : "#d9a0a0"} roughness={0.55} />
    </mesh>
  );
}

function Heart() {
  return (
    <group position={[0, 0.17, 0]} rotation={[0, 0, 0.3]}>
      <mesh scale={[1, 1.2, 0.9]}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial color="#7a1616" roughness={0.4} />
      </mesh>
      <mesh position={[0.02, 0.07, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.018, 0.022, 0.06, 8]} />
        <meshStandardMaterial color="#8a2a22" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Collectible({ target, item, children, position, rotation }: { target: string; item: ItemId; children: React.ReactNode; position: [number, number, number]; rotation?: [number, number, number] }) {
  const taken = useGame((s) => s.collected.includes(item));
  return (
    <Interactable id={target} position={position} rotation={rotation} visible={!taken}>
      {children}
    </Interactable>
  );
}

export function Items() {
  const brainChosen = useGame((s) => s.collected.some((i) => i.startsWith("brain_")));
  const journalTaken = useGame((s) => s.collected.includes("journal"));
  const { leftBench, rightBench, frontTable, brainCabinet, heartShelf, blanketCrate } = PLACES;
  const cabinetWood = useWood("#3a2618");
  return (
    <group>
      <Collectible target="heart_jar" item="heart" position={[heartShelf.x + 0.1, 1.2, heartShelf.z - 0.5]}>
        <Jar position={[0, 0, 0]} liquid="#c9a15a" glow={0.5} contents={<Heart />} />
      </Collectible>

      <group position={[brainCabinet.x, 0, brainCabinet.z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.5, 0]} material={cabinetWood} castShadow>
          <boxGeometry args={[1.9, 1.0, 0.8]} />
        </mesh>
        <mesh position={[0, 1.02, 0]} material={cabinetWood}>
          <boxGeometry args={[2.0, 0.05, 0.9]} />
        </mesh>
        <mesh position={[0, 1.9, -0.32]} material={cabinetWood}>
          <boxGeometry args={[1.9, 1.7, 0.08]} />
        </mesh>
        <mesh position={[-0.45, 1.25, -0.27]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.5, 0.35]} />
          <meshStandardMaterial map={parchment("notes")} roughness={0.9} />
        </mesh>
      </group>
      <Collectible target="brain_scholar_jar" item="brain_scholar" position={[brainCabinet.x + 0.05, 1.05, brainCabinet.z - 0.45]}>
        <Jar position={[0, 0, 0]} liquid="#9fd8c0" glow={0.6} contents={<Brain />} />
      </Collectible>
      <Collectible target="brain_damaged_jar" item="brain_damaged" position={[brainCabinet.x + 0.05, 1.05, brainCabinet.z + 0.45]}>
        <Jar position={[0, 0, 0]} liquid="#7a8a4a" glow={0.35} contents={<Brain damaged />} />
      </Collectible>
      <pointLight position={[brainCabinet.x + 0.6, 1.6, brainCabinet.z]} color="#7fffd0" intensity={brainChosen ? 0.4 : 1.6} distance={3} decay={2} />

      <Bench position={[frontTable.x, 0, frontTable.z]} length={2.4} />
      <Collectible target="serum_jar" item="galvanic_serum" position={[frontTable.x + 0.55, 0.95, frontTable.z - 0.1]}>
        <Jar position={[0, 0, 0]} liquid="#39ff6a" glow={3.5} scale={1.3} />
      </Collectible>
      <pointLight position={[frontTable.x + 0.55, 1.5, frontTable.z]} color="#46ff7a" intensity={2.2} distance={4} decay={2} />
      <Lantern position={[frontTable.x - 0.8, 0.95, frontTable.z + 0.15]} />
      <Jar position={[frontTable.x - 0.25, 0.95, frontTable.z - 0.25]} liquid="#ffb44a" glow={0.4} scale={0.8} />
      <Skull position={[frontTable.x + 0.05, 0.95, frontTable.z + 0.25]} rotation={0.6} />

      <Bench position={[leftBench.x, 0, leftBench.z]} length={leftBench.length} rotation={Math.PI / 2} />
      <Interactable id="journal" position={[leftBench.x + 0.05, 0.96, leftBench.z + 0.3]} rotation={[0, Math.PI / 2 + 0.2, 0]} visible={!journalTaken}>
        <mesh position={[-0.17, 0.02, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.34, 0.03, 0.46]} />
          <meshStandardMaterial map={parchment("body")} roughness={0.9} />
        </mesh>
        <mesh position={[0.17, 0.02, 0]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[0.34, 0.03, 0.46]} />
          <meshStandardMaterial map={parchment("face")} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.005, 0]}>
          <boxGeometry args={[0.72, 0.02, 0.5]} />
          <meshStandardMaterial color="#3a1c10" roughness={0.8} />
        </mesh>
      </Interactable>
      <Skull position={[leftBench.x, 0.95, leftBench.z - 1.0]} rotation={1.2} />
      <Candelabra position={[leftBench.x + 0.15, 0.95, leftBench.z - 0.4]} />
      <Jar position={[leftBench.x - 0.2, 0.95, leftBench.z + 1.3]} liquid="#3cff6a" glow={2.5} scale={1.4} />
      <Lantern position={[leftBench.x + 0.2, 0.95, leftBench.z + 1.0]} intensity={4} />

      <Bench position={[rightBench.x, 0, rightBench.z]} length={rightBench.length} rotation={Math.PI / 2} />
      <Collectible target="tool_tray" item="surgical_tools" position={[rightBench.x - 0.1, 0.96, rightBench.z - 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.6, 0.03, 0.38]} />
          <meshStandardMaterial color="#8a8a86" metalness={0.9} roughness={0.25} />
        </mesh>
        {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
          <mesh key={x} position={[x, 0.04, 0]} rotation={[0, 0.1 * (i - 1.5), 0]}>
            <boxGeometry args={[0.025, 0.012, 0.28]} />
            <meshStandardMaterial color="#c8c8c4" metalness={1} roughness={0.15} />
          </mesh>
        ))}
      </Collectible>
      <Collectible target="suture_kit" item="suture_kit" position={[rightBench.x - 0.05, 0.96, rightBench.z + 0.45]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.28, 0.1, 0.2]} />
          <meshStandardMaterial color="#4a2a1a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.04, 0.012, 8, 16]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.9} />
        </mesh>
      </Collectible>
      <mesh position={[rightBench.x - 0.15, 0.96, rightBench.z + 1.2]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.6, 0.5]} />
        <meshStandardMaterial color="#c9bfa8" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <Candelabra position={[rightBench.x + 0.1, 0.95, rightBench.z + 0.05]} />
      <Jar position={[rightBench.x + 0.25, 0.95, rightBench.z - 1.4]} liquid="#3cff6a" glow={2.2} />

      <group position={[blanketCrate.x, 0, blanketCrate.z]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.8, 0.7, 0.8]} />
          <meshStandardMaterial map={woodGrain()} color="#6a4a32" roughness={0.85} />
        </mesh>
        <Collectible target="blanket" item="blanket" position={[0, 0.76, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 0.12, 0.45]} />
            <meshStandardMaterial color="#5a4a3a" roughness={1} />
          </mesh>
        </Collectible>
      </group>
    </group>
  );
}

export function Decor() {
  return (
    <group>
      <ShelfUnit position={[-3.5, 0, ROOM.minZ + 0.35]} width={3.0} seed={2} />
      <ShelfUnit position={[3.5, 0, ROOM.minZ + 0.35]} width={3.0} seed={3} />
      <ShelfUnit position={[ROOM.minX + 0.35, 0, 4.0]} rotation={Math.PI / 2} width={3.4} seed={4} />
      <ShelfUnit position={[ROOM.maxX - 0.35, 0, PLACES.heartShelf.z]} rotation={-Math.PI / 2} width={2.8} seed={5} />
      {[
        [8.0, -6.9],
        [7.5, -6.1],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.5, z]} castShadow>
          <cylinderGeometry args={[0.38, 0.34, 1.0, 16]} />
          <meshStandardMaterial map={woodGrain()} color="#5a3a24" roughness={0.85} />
        </mesh>
      ))}
      <Candelabra position={[-3.5, 1.95, ROOM.minZ + 0.4]} lit={false} />
      <Candelabra position={[3.5, 1.95, ROOM.minZ + 0.4]} />
      <Lantern position={[-2.2, 0, ROOM.minZ + 0.9]} intensity={3} />
      <Lantern position={[1.6, 0.95, -0.6]} intensity={3.5} />
      {[
        [ROOM.minX + 0.62, 2.6, -5.2, Math.PI / 2],
        [ROOM.maxX - 0.62, 2.6, -1.2, -Math.PI / 2],
        [ROOM.minX + 0.62, 2.6, 0.8, Math.PI / 2],
        [ROOM.maxX - 0.62, 2.6, 4.8, -Math.PI / 2],
      ].map(([x, y, z, r]) => (
        <group key={`${x}${z}`} position={[x, y, z]} rotation={[0, r, 0]}>
          <mesh position={[0, -0.05, -0.08]} material={ironMat}>
            <boxGeometry args={[0.08, 0.3, 0.05]} />
          </mesh>
          <Candle position={[0, 0.1, 0.05]} height={0.2} light={x > 0} />
        </group>
      ))}
    </group>
  );
}
