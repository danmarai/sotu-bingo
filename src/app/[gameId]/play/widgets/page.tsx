"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  ts: number;
}

const EMOJI_REACTIONS = ["🎉", "😂", "🔥", "👀", "💀", "🙌", "😱", "❤️"];

export default function WidgetsPage() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const gameId = params.gameId;
  const token = searchParams.get("token") || "";

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastTsRef = useRef(0);

  // Emoji burst state
  const [bursts, setBursts] = useState<{ emoji: string; id: number }[]>([]);
  const burstIdRef = useRef(0);

  // Poll for new messages every 2s
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/games/${gameId}/chat?since=${lastTsRef.current}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter(
            (m: ChatMessage) => !existing.has(m.id)
          );
          if (newMsgs.length === 0) return prev;
          const merged = [...prev, ...newMsgs].slice(-100);
          lastTsRef.current = Math.max(
            lastTsRef.current,
            ...newMsgs.map((m: ChatMessage) => m.ts)
          );
          return merged;
        });
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 2000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !token) return;
    setSending(true);
    setInput("");
    try {
      await fetch(`/api/games/${gameId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      // Immediately fetch to show our message
      await fetchMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const fireEmoji = async (emoji: string) => {
    const id = ++burstIdRef.current;
    setBursts((prev) => [...prev, { emoji, id }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 2000);
    // Send emoji as chat message
    if (token) {
      try {
        await fetch(`/api/games/${gameId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: emoji }),
        });
        await fetchMessages();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 text-sm">
      {/* Emoji Reactions */}
      <div className="p-3 border-b bg-white">
        <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wide mb-2">
          React
        </h3>
        <div className="flex gap-1.5 flex-wrap">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => fireEmoji(emoji)}
              className="text-xl hover:scale-125 transition-transform active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
        {/* Floating emoji bursts */}
        <div className="relative h-0">
          {bursts.map((b) => (
            <span
              key={b.id}
              className="absolute text-2xl animate-bounce"
              style={{ left: `${Math.random() * 80}%` }}
            >
              {b.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b bg-white">
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wide">
            Chat
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {messages.length === 0 && (
            <p className="text-gray-400 text-xs italic">No messages yet</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className="font-bold text-blue-600">{msg.name}: </span>
              <span className="text-gray-700">{msg.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-2 border-t bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
