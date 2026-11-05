"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/game/Game"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black font-display text-lg tracking-[0.3em] text-parchment/70">
      LIGHTING THE CANDLES…
    </div>
  ),
});

export default function GameLoader() {
  return <Game />;
}
