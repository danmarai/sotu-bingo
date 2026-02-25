"use client";

import type { PlayerSummary } from "@/lib/types";

interface RosterProps {
  roster: PlayerSummary[];
  myPlayerId?: string;
  onPreview: (player: PlayerSummary) => void;
}

const placeBadge = (place: number | null) => {
  if (place === null) return null;
  const colors: Record<number, string> = {
    1: "bg-yellow-400 text-yellow-900",
    2: "bg-gray-300 text-gray-800",
    3: "bg-amber-600 text-white",
  };
  const color = colors[place] || "bg-purple-500 text-white";
  const label = place === 1 ? "1st" : place === 2 ? "2nd" : place === 3 ? "3rd" : `${place}th`;

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${color}`}>
      {label}
    </span>
  );
};

export function Roster({ roster, myPlayerId, onPreview }: RosterProps) {
  const sorted = [...roster].sort((a, b) => b.checkedCount - a.checkedCount);

  return (
    <div className="space-y-1">
      <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide">
        Players ({roster.length})
      </h3>
      {sorted.map((player) => (
        <button
          key={player.playerId}
          onClick={() => onPreview(player)}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-lg
            text-left text-sm transition-colors
            ${
              player.playerId === myPlayerId
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50 hover:bg-gray-100 border border-transparent"
            }
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">
              {player.name}
              {player.playerId === myPlayerId && (
                <span className="text-blue-500 ml-1">(you)</span>
              )}
            </span>
            {placeBadge(player.place)}
          </div>
          <span className="text-gray-500 text-xs shrink-0 ml-2">
            {player.checkedCount}/25
          </span>
        </button>
      ))}
      {roster.length === 0 && (
        <p className="text-gray-400 text-sm italic">No players yet</p>
      )}
    </div>
  );
}
