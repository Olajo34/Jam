"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis Manou, votre assistante beauté & bien-être. Comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(1).slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "Désolé, une erreur est survenue." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connexion difficile. Réessayez dans un instant." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full jam-gradient shadow-xl flex items-center justify-center text-white text-2xl hover:opacity-90 transition-opacity"
        aria-label="Ouvrir Manou"
      >
        {open ? "✕" : "✨"}
      </button>

      {/* Fenêtre de chat */}
      {open && (
        <div className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="jam-gradient px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">M</div>
            <div>
              <p className="text-white font-semibold text-sm">Manou</p>
              <p className="text-white/70 text-xs">Assistante beauté & bien-être · 24h/24</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "jam-gradient text-white rounded-br-sm"
                      : "bg-[var(--color-cream)] text-[var(--color-foreground)] rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-cream)] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-[var(--color-muted-foreground)]">
                  <span className="animate-pulse">Jam réfléchit…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Rechercher une coiffeuse, un massage…"
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-cream)]"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl jam-gradient text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
