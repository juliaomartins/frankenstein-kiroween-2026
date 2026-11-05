"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSETS } from "../config/assets";
import { isAssembled } from "../logic/progress";
import { useGame } from "../state/gameStore";
import { awakeningElapsed, TIMELINE } from "./awakening";
import { FittedModel } from "./FittedModel";
import { Interactable } from "./Interactable";
import { TABLE } from "./layout";
import { useAssetAvailable } from "./useAsset";

const skin = new THREE.MeshStandardMaterial({ color: "#7c8a63", roughness: 0.72, metalness: 0 });
const skinPale = new THREE.MeshStandardMaterial({ color: "#8e9a76", roughness: 0.75 });
const stitch = new THREE.MeshStandardMaterial({ color: "#2a1712", roughness: 0.9 });
const cloth = new THREE.MeshStandardMaterial({ color: "#2e2a24", roughness: 1 });
const hair = new THREE.MeshStandardMaterial({ color: "#121010", roughness: 0.9 });
const bolt = new THREE.MeshStandardMaterial({ color: "#5a5a58", metalness: 0.9, roughness: 0.4 });

function Limb({ from, to, radius, material = skin }: { from: THREE.Vector3Tuple; to: THREE.Vector3Tuple; radius: number; material?: THREE.Material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { position: a.add(b).multiplyScalar(0.5), quaternion: q, length: len };
  }, [from, to]);
  return (
    <group position={position} quaternion={quaternion}>
      <mesh material={material} castShadow>
        <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 6, 12]} />
      </mesh>
      {[-0.2, 0.15].map((t) => (
        <mesh key={t} position={[0, t * length, 0]} rotation={[Math.PI / 2, 0, 0]} material={stitch}>
          <torusGeometry args={[radius * 1.02, 0.006, 4, 16]} />
        </mesh>
      ))}
    </group>
  );
}

interface PoseRefs {
  upper: React.RefObject<THREE.Group | null>;
  head: React.RefObject<THREE.Group | null>;
  armL: React.RefObject<THREE.Group | null>;
  armR: React.RefObject<THREE.Group | null>;
  eyes: React.RefObject<THREE.MeshBasicMaterial | null>;
}

function PlaceholderCreature({ refs, assembled }: { refs: PoseRefs; assembled: boolean }) {
  return (
    <group>
      <Limb from={[-0.02, 0.11, 0.11]} to={[-0.92, 0.09, 0.13]} radius={0.075} />
      <group position={assembled ? [0, 0, 0] : [-0.08, 0, -0.05]}>
        <Limb from={[-0.02, 0.11, -0.11]} to={[-0.92, 0.09, -0.13]} radius={0.075} material={skinPale} />
      </group>
      {[0.13, -0.13].map((z) => (
        <mesh key={z} position={[-0.97, 0.13, z]} rotation={[0, 0, 0.3]} material={skin}>
          <boxGeometry args={[0.1, 0.18, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0.02, 0.1, 0]} material={cloth}>
        <boxGeometry args={[0.24, 0.2, 0.36]} />
      </mesh>
      <group ref={refs.upper}>
        <mesh position={[0.3, 0.12, 0]} material={skin} castShadow>
          <boxGeometry args={[0.52, 0.22, 0.42]} />
        </mesh>
        <mesh position={[0.42, 0.18, 0]} scale={[1, 0.6, 1]} material={skin}>
          <sphereGeometry args={[0.22, 16, 12]} />
        </mesh>
        {[0.15, 0.32, 0.48].map((x) => (
          <mesh key={x} position={[x, 0.235, 0]} material={stitch}>
            <boxGeometry args={[0.012, 0.01, 0.34]} />
          </mesh>
        ))}
        <mesh position={[0.3, 0.234, 0.05]} material={stitch}>
          <boxGeometry args={[0.42, 0.01, 0.012]} />
        </mesh>
        <group ref={refs.armL} position={[0.52, 0.13, 0.27]}>
          <Limb from={[0, 0, 0]} to={[-0.62, -0.02, 0.04]} radius={0.06} />
          <mesh position={[-0.7, -0.01, 0.05]} material={skinPale}>
            <boxGeometry args={[0.14, 0.05, 0.09]} />
          </mesh>
        </group>
        <group ref={refs.armR} position={assembled ? [0.52, 0.13, -0.27] : [0.44, 0.1, -0.36]} rotation={assembled ? [0, 0, 0] : [0, -0.12, 0]}>
          <Limb from={[0, 0, 0]} to={[-0.62, -0.02, -0.04]} radius={0.06} material={skinPale} />
          <mesh position={[-0.7, -0.01, -0.05]} material={skin}>
            <boxGeometry args={[0.14, 0.05, 0.09]} />
          </mesh>
        </group>
        <mesh position={[0.62, 0.13, 0]} rotation={[0, 0, Math.PI / 2]} material={skin}>
          <cylinderGeometry args={[0.065, 0.075, 0.12, 12]} />
        </mesh>
        {[0.075, -0.075].map((z) => (
          <mesh key={z} position={[0.63, 0.13, z * 1.2]} rotation={[Math.PI / 2, 0, 0]} material={bolt}>
            <cylinderGeometry args={[0.018, 0.018, 0.08, 8]} />
          </mesh>
        ))}
        <group ref={refs.head} position={[0.68, 0.14, 0]}>
          <mesh position={[0.13, 0, 0]} material={skin} castShadow>
            <boxGeometry args={[0.26, 0.2, 0.2]} />
          </mesh>
          <mesh position={[0.26, 0, 0]} material={hair}>
            <boxGeometry args={[0.03, 0.2, 0.21]} />
          </mesh>
          <mesh position={[0.2, 0.1, 0]} material={hair}>
            <boxGeometry args={[0.13, 0.03, 0.21]} />
          </mesh>
          <mesh position={[0.17, 0.1, 0]} material={stitch}>
            <boxGeometry args={[0.012, 0.012, 0.2]} />
          </mesh>
          <mesh position={[0.17, 0.105, 0]} material={stitch}>
            <boxGeometry args={[0.012, 0.004, 0.2]} />
          </mesh>
          {[0.045, -0.045].map((z) => (
            <mesh key={z} position={[0.16, 0.1, z]}>
              <sphereGeometry args={[0.016, 10, 8]} />
              <meshBasicMaterial ref={z > 0 ? refs.eyes : undefined} color="#1a1a12" toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0.08, 0.105, 0]} material={stitch}>
            <boxGeometry args={[0.05, 0.01, 0.012]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

const tmpV = new THREE.Vector3();

export function Creature() {
  const available = useAssetAvailable(ASSETS.creature.url);
  const assembled = useGame((s) => isAssembled(s.choices));
  const phase = useGame((s) => s.phase);
  const root = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.MeshBasicMaterial>(null);
  const model = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const anchor = useMemo(() => new THREE.Vector3(TABLE.x, TABLE.height, TABLE.z), []);

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const s = useGame.getState();
    if (s.phase === "playing" || s.phase === "title") {
      g.position.copy(anchor);
      g.rotation.set(0, 0, 0);
      if (upper.current) upper.current.rotation.set(0, 0, 0);
      if (head.current) head.current.rotation.set(0, 0, 0);
      return;
    }
    const t = awakeningElapsed(clock.elapsedTime);
    const good = s.ending?.kind === "good";

    if (t < TIMELINE.surgeEnd) {
      const shake = 0.012 * Math.sin(t * 60) * Math.min(1, t);
      g.position.set(anchor.x, anchor.y + Math.abs(shake) * 2, anchor.z + shake);
      return;
    }
    g.position.copy(anchor);

    if (eyes.current) {
      const glow = Math.min(1, (t - TIMELINE.surgeEnd) / 0.6) * 3;
      eyes.current.color.setRGB(good ? glow * 0.9 : glow * 1.6, good ? glow * 0.85 : glow * 0.15, good ? glow * 0.4 : 0.05);
    }

    if (t < TIMELINE.stirEnd) {
      if (armL.current) armL.current.rotation.y = Math.sin(t * 8) * 0.04;
      return;
    }

    const local = camera.position.clone();
    const lookYaw = () => {
      if (!head.current) return;
      head.current.getWorldPosition(tmpV);
      const yaw = Math.atan2(local.z - tmpV.z, local.x - tmpV.x);
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, THREE.MathUtils.clamp(-yaw * 0.4, -0.7, 0.7), 3, dt);
    };

    if (good) {
      const k = THREE.MathUtils.smoothstep(t, TIMELINE.stirEnd, TIMELINE.riseEnd);
      if (upper.current) upper.current.rotation.z = k * 1.25;
      if (model.current) model.current.rotation.z = k * 1.1;
      lookYaw();
      return;
    }

    if (t < TIMELINE.riseEnd - 0.9) {
      const k = THREE.MathUtils.smoothstep(t, TIMELINE.stirEnd, TIMELINE.stirEnd + 0.5);
      if (upper.current) upper.current.rotation.z = k * 1.45;
      if (model.current) model.current.rotation.z = k * 1.3;
      if (armL.current) armL.current.rotation.z = Math.sin(t * 20) * 0.3;
      if (armR.current) armR.current.rotation.z = -Math.sin(t * 22) * 0.3;
      lookYaw();
      return;
    }

    if (upper.current) upper.current.rotation.z = 0;
    if (model.current) model.current.rotation.z = 0;
    if (armL.current) armL.current.rotation.set(0, 0.5, 1.2);
    if (armR.current) armR.current.rotation.set(0, -0.5, 1.2);
    const k = THREE.MathUtils.smoothstep(t, TIMELINE.riseEnd - 0.9, TIMELINE.attackEnd);
    const startPos = tmpV.set(TABLE.x + 0.4, 0.98, TABLE.z + 1.0);
    const dir = local.clone().sub(startPos);
    dir.y = 0;
    const dist = dir.length();
    dir.normalize();
    const travel = Math.max(0, dist - 0.55) * k;
    g.position.set(startPos.x + dir.x * travel, 0.98, startPos.z + dir.z * travel);
    g.rotation.order = "YXZ";
    g.rotation.set(0, Math.atan2(dir.z, -dir.x), Math.PI / 2 + 0.18);
  });

  return (
    <Interactable id="creature">
      <group ref={root} position={anchor.toArray()}>
        {available ? (
          <Suspense fallback={null}>
            <group ref={model}>
              <FittedModel config={ASSETS.creature} align="bottom" playAnimation={phase === "awakening" || phase === "ending"} />
            </group>
          </Suspense>
        ) : (
          <PlaceholderCreature refs={{ upper, head, armL, armR, eyes }} assembled={assembled} />
        )}
      </group>
    </Interactable>
  );
}
