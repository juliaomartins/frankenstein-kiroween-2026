"use client";

import { AdaptiveDpr, PerformanceMonitor, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useState } from "react";
import * as THREE from "three";
import { ASSETS } from "../config/assets";
import { Creature } from "./Creature";
import { Hands } from "./Hands";
import { Laboratory } from "./Laboratory";
import { ControlConsole, ElectrodeRing, Furnace, OperatingTable, TeslaCoil } from "./Machines";
import { Player } from "./Player";
import { Decor, Items } from "./Props";
import { Storm } from "./Storm";

useGLTF.preload(ASSETS.creature.url);
useGLTF.preload(ASSETS.hands.url);

export function GameCanvas() {
  const [quality, setQuality] = useState<"high" | "low">("high");
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.75]}
      camera={{ fov: 72, near: 0.04, far: 60, position: [0, 1.65, 5.5] }}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.35 }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#05060a");
        scene.fog = new THREE.FogExp2("#0d0f16", 0.038);
      }}
      className="!fixed inset-0"
    >
      <PerformanceMonitor onDecline={() => setQuality("low")} />
      <AdaptiveDpr pixelated />
      <hemisphereLight args={["#4a5a7a", "#2a1a10", 0.55]} />
      <ambientLight color="#ffd9b0" intensity={0.1} />
      <Laboratory />
      <Decor />
      <Items />
      <OperatingTable />
      <ElectrodeRing />
      <TeslaCoil />
      <ControlConsole />
      <Furnace />
      <Creature />
      <Storm />
      <Player />
      <Hands />
      <EffectComposer multisampling={quality === "high" ? 4 : 0}>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={quality === "high" ? 1.1 : 0.7} />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
