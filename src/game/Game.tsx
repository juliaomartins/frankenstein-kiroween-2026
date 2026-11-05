"use client";

import { GameCanvas } from "./scene/GameCanvas";
import { AdvisorPanel } from "./ui/AdvisorPanel";
import { Hud } from "./ui/Hud";
import { Panels } from "./ui/Panels";
import { CinematicOverlay, EndingScreen } from "./ui/Screens";
import { TitleScreen } from "./ui/TitleScreen";
import { useGameInput } from "./ui/useGameInput";

export default function Game() {
  useGameInput();
  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <GameCanvas />
      <Hud />
      <CinematicOverlay />
      <Panels />
      <AdvisorPanel />
      <TitleScreen />
      <EndingScreen />
    </main>
  );
}
