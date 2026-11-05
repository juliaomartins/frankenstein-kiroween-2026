"use client";

import { useEffect, useRef, useState } from "react";
import { useGame, useObjectives, snapshotGameState } from "../state/gameStore";
import { ITEMS } from "../logic/content";
import { ChatIcon } from "./Icons";

const SUGGESTIONS = ["What should I do next?", "Which brain should I choose?", "Is the creature ready to wake?", "Is it right to create life?"];

export function AdvisorPanel() {
  const open = useGame((s) => s.panel === "advisor");
  const close = useGame((s) => s.closePanel);
  const messages = useGame((s) => s.advisorMessages);
  const busy = useGame((s) => s.advisorBusy);
  const objectives = useObjectives();
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"live" | "offline" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const store = useGame.getState();
    store.addAdvisorMessage({ role: "user", content: question });
    const history = useGame.getState().advisorMessages;
    store.addAdvisorMessage({ role: "assistant", content: "" });
    store.setAdvisorBusy(true);
    setDraft("");
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-30),
          context: {
            state: snapshotGameState(),
            objectives,
            inventory: store.inventory.map((i) => ITEMS[i].name),
            choiceLog: store.choiceLog,
          },
        }),
      });
      setMode(res.headers.get("X-Advisor-Mode") === "offline" ? "offline" : "live");
      if (!res.ok || !res.body) throw new Error(`Advisor request failed: ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        useGame.getState().appendToLastAdvisorMessage(decoder.decode(value, { stream: true }));
      }
    } catch {
      useGame.getState().appendToLastAdvisorMessage("The apparatus crackles and falls silent. (The advisor could not be reached.)");
    } finally {
      useGame.getState().setAdvisorBusy(false);
    }
  }

  return (
    <aside
      aria-hidden={!open}
      className={`fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-gold/30 bg-gradient-to-b from-[#16100c]/95 to-[#08080c]/95 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform duration-300 ${open ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
    >
      <header className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <ChatIcon className="h-7 w-7 text-gold" />
          <div>
            <h2 className="font-display text-xl font-bold tracking-wide text-gold">The Advisor</h2>
            <p className="text-xs italic text-parchment/60">
              Reason and conscience in brass and wire{mode === "offline" ? " · offline mode" : ""}
            </p>
          </div>
        </div>
        <button type="button" onClick={close} className="text-2xl text-white/50 hover:text-gold" aria-label="Close advisor">
          ×
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="font-display text-[15px] italic leading-relaxed text-parchment/80">
            &ldquo;Speak, Victor. I see what you see and remember what you have done. Ask, and I will counsel you. But the choices are yours alone.&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-xl rounded-br-sm border border-white/10 bg-white/[0.07] px-4 py-2 text-[15px] text-white"
                  : "max-w-[95%] whitespace-pre-wrap font-display text-[15px] leading-relaxed text-parchment"
              }
            >
              {m.content || (busy && i === messages.length - 1 ? <span className="animate-pulse text-gold/70">The valves glow…</span> : "")}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gold/20 px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => send(s)} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-parchment/85 transition hover:bg-gold/10 disabled:opacity-40">
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={600}
            placeholder="Ask the Advisor…"
            className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white placeholder:text-white/35 focus:border-gold/60 focus:outline-none"
          />
          <button type="submit" disabled={busy || !draft.trim()} className="rounded-lg border border-gold/60 bg-gold/15 px-4 font-display font-bold text-gold transition hover:bg-gold/25 disabled:opacity-40">
            Ask
          </button>
        </form>
        <p className="mt-2 text-[11px] text-white/35">Esc or C to close · The Advisor offers counsel only; your actions decide the outcome.</p>
      </div>
    </aside>
  );
}
