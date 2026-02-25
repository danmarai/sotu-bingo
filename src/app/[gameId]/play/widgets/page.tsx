"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface ChatMessage {
  name: string;
  text: string;
  ts: number;
}

const EMOJI_REACTIONS = ["🎉", "😂", "🔥", "👀", "💀", "🙌", "😱", "❤️"];

export default function WidgetsPage() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const gameId = params.gameId;
  const playerName = searchParams.get("name") || "Anon";

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  // Emoji burst state
  const [bursts, setBursts] = useState<{ emoji: string; id: number }[]>([]);
  let burstId = 0;

  const addMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev.slice(-50), // keep last 50
      { name: playerName, text: input.trim(), ts: Date.now() },
    ]);
    setInput("");
  };

  const fireEmoji = (emoji: string) => {
    const id = ++burstId;
    setBursts((prev) => [...prev, { emoji, id }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 2000);
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
          {messages.map((msg, i) => (
            <div key={i} className="text-xs">
              <span className="font-bold text-blue-600">{msg.name}: </span>
              <span className="text-gray-700">{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="p-2 border-t bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMessage()}
            placeholder="Type a message..."
            className="flex-1 border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={addMessage}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
