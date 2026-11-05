"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGame } from "../state/gameStore";
import { Arc } from "./Arc";
import { Interactable } from "./Interactable";
import { PLACES, ROOM, TABLE } from "./layout";
import { stormState } from "./stormState";
import { stoneWall, repeatedSet, woodGrain } from "./textures";

const copper = new THREE.MeshStandardMaterial({ color: "#a8592c", metalness: 0.95, roughness: 0.32 });
const iron = new THREE.MeshStandardMaterial({ color: "#2a2724", metalness: 0.85, roughness: 0.55 });
const brass = new THREE.MeshStandardMaterial({ color: "#b58a3c", metalness: 0.9, roughness: 0.35 });

const ringArcActivity = () => 0.35 + stormState.flash * 0.6 + stormState.awakenSurge;

const RING_Y = 4.4;
const RING_ARCS: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [[1.25, RING_Y, TABLE.z], [2.4, RING_Y + 2.6, TABLE.z + 0.6]],
  [[-1.25, RING_Y, TABLE.z], [-2.6, RING_Y + 2.4, TABLE.z - 0.8]],
  [[0, RING_Y, TABLE.z + 1.25], [0.8, RING_Y + 2.7, TABLE.z + 2.4]],
  [[0.9, RING_Y - 0.6, TABLE.z - 0.9], [1.6, RING_Y - 2.4, TABLE.z - 1.6]],
  [[-0.9, RING_Y - 0.6, TABLE.z + 0.9], [-1.5, RING_Y - 2.2, TABLE.z + 1.7]],
  [[0, RING_Y - 0.9, TABLE.z], [0.05, TABLE.height + 0.35, TABLE.z]],
];

export function ElectrodeRing() {
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(TABLE.x, 0, TABLE.z);
    return o;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker = 0.85 + Math.sin(t * 23) * 0.05 + Math.random() * 0.1;
    if (spot.current) spot.current.intensity = (55 + stormState.flash * 120 + stormState.awakenSurge * 260) * flicker;
  });

  return (
    <group>
      <mesh position={[TABLE.x, (RING_Y + ROOM.wallHeight + ROOM.vaultRise) / 2 + 0.3, TABLE.z]} material={iron}>
        <cylinderGeometry args={[0.05, 0.05, ROOM.wallHeight + ROOM.vaultRise - RING_Y, 8]} />
      </mesh>
      <group position={[TABLE.x, RING_Y, TABLE.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={copper}>
          <torusGeometry args={[1.25, 0.09, 12, 48]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} material={brass}>
          <torusGeometry args={[0.85, 0.06, 10, 40]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} material={copper}>
          <torusGeometry args={[0.7, 0.07, 10, 40]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.0, -0.2, Math.sin(a) * 1.0]} rotation={[0, -a, 0.6]} material={iron}>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
            </mesh>
          );
        })}
        <mesh position={[0, -0.6, 0]} material={brass}>
          <cylinderGeometry args={[0.18, 0.28, 0.5, 16]} />
        </mesh>
        <mesh position={[0, -0.92, 0]}>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshBasicMaterial color={new THREE.Color("#bcd8ff").multiplyScalar(4)} toneMapped={false} />
        </mesh>
      </group>
      {RING_ARCS.map(([from, to], i) => (
        <Arc key={i} from={from} to={to} jitter={0.35} activity={ringArcActivity} rate={14 + i * 3} />
      ))}
      <primitive object={target} />
      <spotLight
        ref={spot}
        position={[TABLE.x, RING_Y - 0.9, TABLE.z]}
        target={target}
        angle={0.62}
        penumbra={0.65}
        distance={9}
        decay={1.6}
        color="#c4d8ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </group>
  );
}

export function OperatingTable() {
  const wood = useMemo(() => woodGrain(), []);
  const restraints = useGame((s) => s.choices.restraints);
  const loose = restraints === "loose";
  const strapZ = [-0.85, -0.25, 0.35, 0.9];
  return (
    <group position={[TABLE.x, 0, TABLE.z]}>
      <mesh position={[0, TABLE.height - 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[TABLE.width, 0.16, TABLE.depth]} />
        <meshStandardMaterial map={wood} color="#6b5040" roughness={0.75} />
      </mesh>
      <mesh position={[0, TABLE.height - 0.2, 0]} material={iron}>
        <boxGeometry args={[TABLE.width + 0.08, 0.1, TABLE.depth + 0.08]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (TABLE.width / 2 - 0.15), (TABLE.height - 0.2) / 2, sz * (TABLE.depth / 2 - 0.12)]} material={iron} castShadow>
            <boxGeometry args={[0.14, TABLE.height - 0.2, 0.14]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.25, 0]} material={iron}>
        <boxGeometry args={[TABLE.width - 0.3, 0.06, TABLE.depth - 0.25]} />
      </mesh>
      {strapZ.map((x) => (
        <group key={x} position={[x, TABLE.height, 0]}>
          {loose ? (
            [-1, 1].map((s) => (
              <mesh key={s} position={[0, -0.25, s * (TABLE.depth / 2 + 0.02)]}>
                <boxGeometry args={[0.1, 0.5, 0.015]} />
                <meshStandardMaterial color="#3b2416" roughness={0.8} />
              </mesh>
            ))
          ) : (
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.11, 0.025, TABLE.depth + 0.04]} />
              <meshStandardMaterial color={restraints === "tight" ? "#2a170d" : "#3b2416"} roughness={0.8} />
            </mesh>
          )}
        </group>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-1.1 + i * 0.44, 0.45, (i % 2 ? 1 : -1) * (TABLE.depth / 2 + 0.02)]} material={iron}>
          <torusGeometry args={[0.04, 0.012, 6, 12]} />
        </mesh>
      ))}
    </group>
  );
}

export function TeslaCoil() {
  const light = useRef<THREE.PointLight>(null);
  const { x, z } = PLACES.tesla;
  const activity = () => 0.45 + stormState.awakenSurge;
  const arcs = useMemo<[THREE.Vector3Tuple, THREE.Vector3Tuple][]>(
    () => [
      [[x + 0.6, 3.25, z], [x + 1.6, 4.4, z + 0.8]],
      [[x - 0.6, 3.25, z], [x - 1.7, 4.0, z + 0.4]],
      [[x, 3.3, z + 0.6], [x - 0.4, 4.6, z + 1.6]],
      [[x, 3.3, z - 0.6], [x + 0.9, 4.8, z - 0.9]],
    ],
    [x, z],
  );
  useFrame(() => {
    if (light.current) light.current.intensity = 4 + Math.random() * 6 + stormState.awakenSurge * 20;
  });
  return (
    <Interactable id="tesla" position={[0, 0, 0]}>
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.35, 0]} material={iron} castShadow>
          <boxGeometry args={[1.4, 0.7, 1.4]} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.36, 2.2, 24]} />
          <meshStandardMaterial color="#7a2d18" metalness={0.7} roughness={0.35} />
        </mesh>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={i} position={[0, 0.8 + i * 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={copper}>
            <torusGeometry args={[0.36, 0.02, 6, 24]} />
          </mesh>
        ))}
        <mesh position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={iron}>
          <torusGeometry args={[0.55, 0.16, 12, 32]} />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshBasicMaterial color={new THREE.Color("#a8ccff").multiplyScalar(5)} toneMapped={false} />
        </mesh>
      </group>
      {arcs.map(([from, to], i) => (
        <Arc key={i} from={from} to={to} jitter={0.4} activity={activity} rate={12 + i * 4} />
      ))}
      <pointLight ref={light} position={[x, 3.5, z + 0.5]} color="#7fa8ff" distance={8} decay={1.8} intensity={6} />
    </Interactable>
  );
}

export function ControlConsole() {
  const lever = useRef<THREE.Group>(null);
  const gauges = useRef<THREE.MeshBasicMaterial[]>([]);
  const phase = useGame((s) => s.phase);
  const calibrated = useGame((s) => s.choices.calibration !== null);
  const { x, z } = PLACES.console;

  useFrame(({ clock }, dt) => {
    if (lever.current) {
      const target = phase === "awakening" || phase === "ending" ? -1.0 : 0.7;
      lever.current.rotation.x = THREE.MathUtils.damp(lever.current.rotation.x, target, 6, dt);
    }
    gauges.current.forEach((m, i) => {
      if (m) m.color.setRGB(0.2 + 0.25 * Math.sin(clock.elapsedTime * (1 + i) + i) + (calibrated ? 0.6 : 0.2), calibrated ? 1.4 : 0.6, 0.3);
    });
  });

  return (
    <group position={[x, 0, z]} rotation={[0, -0.35, 0]}>
      <Interactable id="console">
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.85, 1.0, 0.6]} />
          <meshStandardMaterial map={woodGrain()} color="#4a3324" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.08, 0.04]} rotation={[-0.5, 0, 0]} material={brass}>
          <boxGeometry args={[0.8, 0.04, 0.45]} />
        </mesh>
        {[-0.25, 0, 0.25].map((gx, i) => (
          <group key={gx} position={[gx, 1.12, 0.06]} rotation={[-0.5, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={iron}>
              <cylinderGeometry args={[0.09, 0.09, 0.03, 20]} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <circleGeometry args={[0.075, 20]} />
              <meshBasicMaterial
                ref={(m) => {
                  if (m) gauges.current[i] = m;
                }}
                color="#335522"
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </Interactable>
      <Interactable id="lever">
        <group position={[0.52, 0.9, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={iron}>
            <cylinderGeometry args={[0.07, 0.07, 0.18, 12]} />
          </mesh>
          <group ref={lever} position={[0.06, 0, 0]}>
            <mesh position={[0, 0.3, 0]} material={iron}>
              <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
              <sphereGeometry args={[0.06, 12, 10]} />
              <meshStandardMaterial color="#7a1010" roughness={0.4} />
            </mesh>
          </group>
        </group>
      </Interactable>
    </group>
  );
}

export function Furnace() {
  const light = useRef<THREE.PointLight>(null);
  const fire = useRef<THREE.MeshBasicMaterial>(null);
  const { x, z } = PLACES.furnace;
  const brick = useMemo(() => {
    const set = repeatedSet(stoneWall(), 1.2, 1.2);
    return new THREE.MeshStandardMaterial({ map: set.map, bumpMap: set.bumpMap, bumpScale: 2, color: "#a07060", roughness: 0.95 });
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 0.8 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1) * 0.06 + Math.random() * 0.08;
    if (light.current) light.current.intensity = 14 * f;
    if (fire.current) fire.current.color.setRGB(3.2 * f, 1.3 * f, 0.35 * f);
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} material={brick} castShadow>
        <boxGeometry args={[2.8, 1.8, 1.4]} />
      </mesh>
      <mesh position={[0, 1.8, 0]} scale={[1.4, 0.8, 0.7]} material={brick}>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.75, 0.71]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshBasicMaterial ref={fire} color="#ff7a2a" toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.6, -0.3]} material={brick}>
        <boxGeometry args={[0.7, 3.2, 0.7]} />
      </mesh>
      <pointLight ref={light} position={[0, 0.9, 1.3]} color="#ff8a3a" distance={9} decay={1.7} intensity={14} castShadow={false} />
    </group>
  );
}
