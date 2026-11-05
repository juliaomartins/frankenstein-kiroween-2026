"use client";

import { RoundedBox, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSETS } from "../config/assets";
import { useGame } from "../state/gameStore";
import { applyHandGrip, buildHandRig } from "./handsRig";
import { playerState } from "./playerState";
import { useAssetAvailable } from "./useAsset";

const skinMat = new THREE.MeshStandardMaterial({ color: "#b8876a", roughness: 0.55, emissive: "#3a160c", emissiveIntensity: 0.12 });
const sleeveMat = new THREE.MeshStandardMaterial({ color: "#4b4036", roughness: 0.95 });
const cuffMat = new THREE.MeshStandardMaterial({ color: "#d8cdb8", roughness: 0.9 });

const FINGERS = [
  { x: -0.034, len: 0.07, spread: 0.1 },
  { x: -0.012, len: 0.082, spread: 0.03 },
  { x: 0.011, len: 0.079, spread: -0.03 },
  { x: 0.032, len: 0.064, spread: -0.1 },
];

function Hand({ side, fingers }: { side: 1 | -1; fingers: React.RefObject<(THREE.Group | null)[]> }) {
  return (
    <group scale={[side * 1.12, 1.12, 1.12]}>
      <RoundedBox args={[0.094, 0.034, 0.104]} radius={0.015} smoothness={4} material={skinMat} castShadow />
      <mesh position={[0, 0.012, 0.005]} scale={[1, 0.32, 1.05]} material={skinMat}>
        <sphereGeometry args={[0.05, 16, 12]} />
      </mesh>
      {FINGERS.map((f, i) => (
        <group
          key={i}
          position={[f.x, 0.002, -0.05]}
          rotation={[0, f.spread, 0]}
          ref={(g) => {
            if (fingers.current) fingers.current[2 * i] = g;
          }}
        >
          <mesh position={[0, 0.004, 0]} material={skinMat}>
            <sphereGeometry args={[0.0125, 10, 8]} />
          </mesh>
          <mesh position={[0, 0, -f.len * 0.28]} rotation={[Math.PI / 2, 0, 0]} material={skinMat}>
            <capsuleGeometry args={[0.0105, f.len * 0.4, 4, 8]} />
          </mesh>
          <group
            position={[0, 0, -f.len * 0.55]}
            ref={(g) => {
              if (fingers.current) fingers.current[2 * i + 1] = g;
            }}
          >
            <mesh position={[0, 0, -f.len * 0.22]} rotation={[Math.PI / 2, 0, 0]} material={skinMat}>
              <capsuleGeometry args={[0.0095, f.len * 0.3, 4, 8]} />
            </mesh>
          </group>
        </group>
      ))}
      <group position={[-0.046, -0.006, -0.012]} rotation={[0.2, 0.75, 0.45]}>
        <mesh position={[0, 0, -0.022]} rotation={[Math.PI / 2, 0, 0]} material={skinMat}>
          <capsuleGeometry args={[0.013, 0.03, 4, 8]} />
        </mesh>
        <mesh position={[0, 0, -0.052]} rotation={[Math.PI / 2, 0, 0]} material={skinMat}>
          <capsuleGeometry args={[0.011, 0.024, 4, 8]} />
        </mesh>
      </group>
      <mesh position={[0, -0.003, 0.15]} rotation={[Math.PI / 2 - 0.06, 0, 0]} material={skinMat}>
        <capsuleGeometry args={[0.031, 0.19, 4, 12]} />
      </mesh>
      <mesh position={[0, -0.006, 0.3]} rotation={[Math.PI / 2 - 0.06, 0, 0]} material={sleeveMat}>
        <cylinderGeometry args={[0.054, 0.062, 0.3, 16]} />
      </mesh>
      <mesh position={[0, -0.002, 0.162]} rotation={[Math.PI / 2 - 0.06, 0, 0]} material={cuffMat}>
        <cylinderGeometry args={[0.04, 0.045, 0.035, 16]} />
      </mesh>
    </group>
  );
}

interface Grip {
  left: number;
  right: number;
}

function GlbHand({ side, grip }: { side: 1 | -1; grip: React.RefObject<Grip> }) {
  const gltf = useGLTF(ASSETS.hands.url);
  const handRig = useMemo(() => buildHandRig(gltf, side), [gltf, side]);
  useFrame(() => {
    if (handRig) applyHandGrip(handRig, side > 0 ? grip.current.right : grip.current.left);
  });
  if (!handRig) return null;
  return (
    <group>
      <primitive object={handRig.holder} />
      <mesh position={[0, -0.012, 0.25]} rotation={[Math.PI / 2 - 0.06, 0, 0]} material={sleeveMat}>
        <cylinderGeometry args={[0.05, 0.06, 0.26, 16]} />
      </mesh>
      <mesh position={[0, -0.008, 0.125]} rotation={[Math.PI / 2 - 0.06, 0, 0]} material={cuffMat}>
        <cylinderGeometry args={[0.042, 0.047, 0.03, 16]} />
      </mesh>
    </group>
  );
}

export function Hands() {
  const camera = useThree((s) => s.camera);
  const rig = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const grip = useRef<Grip>({ left: 0.08, right: 0.08 });
  const leftFingers = useRef<(THREE.Group | null)[]>([]);
  const rightFingers = useRef<(THREE.Group | null)[]>([]);
  const fileAvailable = useAssetAvailable(ASSETS.hands.url);
  const available = ASSETS.hands.enabled !== false && fileAvailable;
  const phase = useGame((s) => s.phase);
  const base = useMemo(
    () => ({
      left: new THREE.Vector3(-0.22, -0.245, -0.42),
      right: new THREE.Vector3(0.22, -0.245, -0.42),
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!rig.current) return;
    rig.current.position.copy(camera.position);
    rig.current.quaternion.copy(camera.quaternion);

    const t = clock.elapsedTime;
    const { handAction } = useGame.getState();
    const since = performance.now() / 1000 - handAction.at;
    const pulse = since < 0.7 ? Math.sin((since / 0.7) * Math.PI) : 0;
    const breathe = Math.sin(t * 1.6) * 0.004;
    const walk = playerState.speed > 0.1 ? Math.sin(playerState.bob * 2) * 0.012 : 0;
    const sway = playerState.speed > 0.1 ? Math.cos(playerState.bob) * 0.01 : 0;
    const curl = 0.55 + pulse * 0.7 + Math.sin(t * 0.9) * 0.04;

    if (right.current) {
      right.current.position.set(
        base.right.x - pulse * 0.08 + sway,
        base.right.y + breathe + walk + pulse * 0.1,
        base.right.z - pulse * 0.2,
      );
      right.current.rotation.set(0.62 - pulse * 0.4, 0.22 + pulse * 0.1, 0.3);
    }
    if (left.current) {
      const usePulse = handAction.kind === "use" ? pulse : 0;
      left.current.position.set(
        base.left.x + usePulse * 0.08 + sway,
        base.left.y + breathe - walk + usePulse * 0.1,
        base.left.z - usePulse * 0.18,
      );
      left.current.rotation.set(0.62 - usePulse * 0.4, -0.22 - usePulse * 0.1, -0.3);
    }
    grip.current.right = 0.08 + pulse * 0.92 + Math.sin(t * 0.9) * 0.03;
    grip.current.left = 0.08 + (handAction.kind === "use" ? pulse * 0.92 : 0) + Math.sin(t * 0.8 + 1) * 0.03;
    rightFingers.current.forEach((f) => f && (f.rotation.x = -curl));
    const leftCurl = 0.55 + (handAction.kind === "use" ? pulse * 0.7 : 0) + Math.sin(t * 0.8 + 1) * 0.04;
    leftFingers.current.forEach((f) => f && (f.rotation.x = -leftCurl));
  });

  return (
    <group ref={rig}>
      <group visible={phase !== "title"}>
      {available ? (
        <Suspense fallback={null}>
          <group ref={left}>
            <GlbHand side={-1} grip={grip} />
          </group>
          <group ref={right}>
            <GlbHand side={1} grip={grip} />
          </group>
        </Suspense>
      ) : (
        <>
          <group ref={left}>
            <Hand side={-1} fingers={leftFingers} />
          </group>
          <group ref={right}>
            <Hand side={1} fingers={rightFingers} />
          </group>
        </>
      )}
      </group>
      <pointLight position={[0, 0.12, -0.25]} intensity={0.9} distance={1.1} decay={2} color="#ffd2a6" />
    </group>
  );
}
