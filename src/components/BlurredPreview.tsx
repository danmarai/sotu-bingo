"use client";

import type { PlayerSummary } from "@/lib/types";

interface BlurredPreviewProps {
  player: PlayerSummary;
  onClose: () => void;
}

export function BlurredPreview({ player, onClose }: BlurredPreviewProps) {
  const placeBadge =
    player.place !== null
      ? player.place === 1
        ? "🥇 1st"
        : player.place === 2
        ? "🥈 2nd"
        : player.place === 3
        ? "🥉 3rd"
        : `${player.place}th`
      : null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">{player.name}</h3>
            <p className="text-sm text-gray-500">
              {player.checkedCount}/25 checked
              {placeBadge && (
                <span className="ml-2 font-bold">{placeBadge}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Blurred 5x5 grid — shows checked pattern only, no text */}
        <div className="grid grid-cols-5 gap-1">
          {player.miniChecks.map((checked, i) => (
            <div
              key={i}
              className={`
                aspect-square rounded
                ${
                  i === 12
                    ? "bg-yellow-400"
                    : checked
                    ? "bg-green-400"
                    : "bg-gray-200"
                }
              `}
            />
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Board preview — tile text hidden
        </p>
      </div>
    </div>
  );
}
