"use client";

import type { Word } from "@/lib/types";

interface CalledWordsProps {
  words: Word[];
  called: string[];
  isHost: boolean;
  onToggle: (canonical: string, called: boolean) => void;
}

export function CalledWords({
  words,
  called,
  isHost,
  onToggle,
}: CalledWordsProps) {
  const calledSet = new Set(called);

  if (!isHost) {
    // Player view: read-only called words list
    return (
      <div className="space-y-2">
        <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide">
          Called Words ({called.length})
        </h3>
        {called.length === 0 ? (
          <p className="text-gray-400 text-sm italic">None called yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {called.map((c) => {
              const word = words.find((w) => w.canonical === c);
              return (
                <span
                  key={c}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {word?.display || c}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Host view: toggleable word list
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide">
        Called Words ({called.length}/{words.length})
      </h3>
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {words.map((word) => {
          const isCalled = calledSet.has(word.canonical);
          return (
            <button
              key={word.canonical}
              onClick={() => onToggle(word.canonical, !isCalled)}
              className={`
                w-full text-left px-3 py-1.5 rounded text-sm
                transition-colors
                ${
                  isCalled
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {word.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}
