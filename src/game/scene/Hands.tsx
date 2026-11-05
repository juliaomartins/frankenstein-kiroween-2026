"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSETS } from "../config/assets";
import { useGame } from "../state/gameStore";
import { applyHandGrip, buildHandRig } from "./handsRig";
import { usePrecompiled } from "./usePrecompiled";
import { playerState } from "./playerState";

const sleeveMat = new THREE.MeshStandardMaterial({ color: "#221b16", roughness: 1 });
const cuffMat = new THREE.MeshStandardMaterial({ color: "#6e6556", roughness: 1 });

interface Grip {
  left: number;
  right: number;
}

function GlbHand({ side, grip }: { side: 1 | -1; grip: React.RefObject<Grip> }) {
  const gltf = useGLTF(ASSETS.hands.url);
  const handRig = useMemo(() => buildHandRig(gltf, side), [gltf, side]);
  const ready = usePrecompiled(handRig?.holder ?? null);
  useFrame(() => {
    if (handRig) applyHandGrip(handRig, side > 0 ? grip.current.right : grip.current.left);
  });
  if (!handRig) return null;
  return (
    <group visible={ready}>
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
  });

  return (
    <group ref={rig}>
      <group visible={phase !== "title"}>
        <Suspense fallback={null}>
          <group ref={left}>
            <GlbHand side={-1} grip={grip} />
          </group>
          <group ref={right}>
            <GlbHand side={1} grip={grip} />
          </group>
        </Suspense>
      </group>
      <pointLight position={[0, 0.3, -0.7]} intensity={0.8} distance={1.4} decay={2} color="#ffd2a6" />
    </group>
  );
}
