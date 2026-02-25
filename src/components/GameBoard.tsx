"use client";

import type { Board } from "@/lib/types";

interface GameBoardProps {
  board: Board;
  checks: Record<number, boolean>;
  called: string[];
  isLive: boolean;
  onToggle: (pos: number, checked: boolean) => void;
}

export function GameBoard({
  board,
  checks,
  called,
  isLive,
  onToggle,
}: GameBoardProps) {
  const calledSet = new Set(called);

  return (
    <div className="grid grid-cols-5 gap-1.5 max-w-[500px] mx-auto">
      {board.tiles.map((tile) => {
        const isChecked = tile.isFree || checks[tile.pos] === true;
        const isCalled =
          tile.canonical !== null && calledSet.has(tile.canonical);
        const canClick = isLive && !tile.isFree;

        return (
          <button
            key={tile.pos}
            onClick={() => canClick && onToggle(tile.pos, !isChecked)}
            disabled={!canClick}
            className={`
              aspect-square flex items-center justify-center p-1
              text-xs sm:text-sm font-medium rounded-lg
              transition-all duration-150 select-none
              border-2
              ${
                tile.isFree
                  ? "bg-yellow-400 border-yellow-500 text-yellow-900 cursor-default font-bold"
                  : isChecked
                  ? "bg-green-500 border-green-600 text-white shadow-inner"
                  : isCalled
                  ? "bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }
              ${canClick ? "cursor-pointer active:scale-95" : ""}
            `}
          >
            <span className="text-center leading-tight break-words overflow-hidden">
              {tile.display}
            </span>
          </button>
        );
      })}
    </div>
  );
}
