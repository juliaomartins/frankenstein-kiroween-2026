"use client";

import { useEffect } from "react";
import { chime } from "../audio";
import { useGame } from "../state/gameStore";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function useGameInput() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (e.code === "Escape") {
        if (s.panel) s.closePanel();
        return;
      }
      if (e.code === "Tab") e.preventDefault();
      if (isTyping(e.target) || e.repeat || s.phase !== "playing") return;

      switch (e.code) {
        case "Tab":
          s.togglePanel("inventory");
          break;
        case "KeyC":
          s.togglePanel("advisor");
          break;
        case "KeyE":
          if (!s.panel && s.hovered?.e) {
            const before = s.collected.length;
            s.interact(s.hovered.id);
            if (useGame.getState().collected.length > before) chime();
          }
          break;
        case "KeyF":
          if (!s.panel) s.useTool(s.hovered?.id ?? "");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
