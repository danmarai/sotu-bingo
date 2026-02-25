"use client";

import { useEffect, useState } from "react";
import type { WinnerRecord } from "@/lib/types";

interface WinnerToastProps {
  winners: WinnerRecord[];
}

export function WinnerToast({ winners }: WinnerToastProps) {
  const [seenCount, setSeenCount] = useState(0);
  const [visible, setVisible] = useState<WinnerRecord | null>(null);

  useEffect(() => {
    if (winners.length > seenCount) {
      // Show the newest winner
      const newWinner = winners[winners.length - 1];
      setVisible(newWinner);
      setSeenCount(winners.length);

      const timer = setTimeout(() => setVisible(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [winners, seenCount]);

  if (!visible) return null;

  const placeLabel =
    visible.place === 1
      ? "🥇 1st Place!"
      : visible.place === 2
      ? "🥈 2nd Place!"
      : visible.place === 3
      ? "🥉 3rd Place!"
      : `🏆 ${visible.place}th Place!`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-yellow-900 px-6 py-3 rounded-xl shadow-lg border-2 border-yellow-500">
        <p className="font-bold text-lg text-center">
          {placeLabel}
        </p>
        <p className="text-center text-sm font-medium">
          {visible.name} got BINGO!
        </p>
      </div>
    </div>
  );
}
