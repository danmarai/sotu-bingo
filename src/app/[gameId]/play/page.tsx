"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameApi } from "@/hooks/use-game-api";
import { usePolling } from "@/hooks/use-polling";
import { useWidgetVersion } from "@/hooks/use-widget-version";
import { GameBoard } from "@/components/GameBoard";
import { Roster } from "@/components/Roster";
import { CalledWords } from "@/components/CalledWords";
import { BlurredPreview } from "@/components/BlurredPreview";
import { WinnerToast } from "@/components/WinnerToast";
import type { UISnapshot, Board, PlayerSummary } from "@/lib/types";

export default function PlayPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const api = useGameApi();
  const gameId = params.gameId;

  // Player credentials from localStorage
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Game state
  const [snapshot, setSnapshot] = useState<UISnapshot | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");

  // Preview modal
  const [previewPlayer, setPreviewPlayer] = useState<PlayerSummary | null>(
    null
  );

  // Widget version polling (30s) — key changes on new deploy
  const { widgetKey } = useWidgetVersion();
  const [playerName, setPlayerName] = useState<string>("");

  // Load player name for widget
  useEffect(() => {
    setPlayerName(localStorage.getItem(`playerName:${gameId}`) || "Anon");
  }, [gameId]);

  // Load credentials
  useEffect(() => {
    const token = localStorage.getItem(`player:${gameId}`);
    const pid = localStorage.getItem(`playerId:${gameId}`);
    if (!token || !pid) {
      router.replace(`/${gameId}`);
      return;
    }
    setPlayerToken(token);
    setPlayerId(pid);
  }, [gameId, router]);

  const onSnapshot = useCallback(
    (snap: UISnapshot) => {
      setSnapshot(snap);
      // Update board and checks from snapshot
      if (snap.myBoard) setBoard(snap.myBoard);
      if (snap.myChecks) setChecks(snap.myChecks);
    },
    []
  );

  const { refresh } = usePolling({
    gameId,
    token: playerToken,
    enabled: !!playerToken,
    onSnapshot,
  });

  const handleToggleTile = async (pos: number, checked: boolean) => {
    if (!playerToken) return;

    // Optimistic update
    setChecks((prev) => ({ ...prev, [pos]: checked }));

    try {
      const result = await api.toggleTile(gameId, playerToken, pos, checked);
      if (result.didWin) {
        // Will show via polling toast
      }
      refresh();
    } catch (err) {
      // Revert optimistic update
      setChecks((prev) => ({ ...prev, [pos]: !checked }));
      setError(err instanceof Error ? err.message : "Failed to toggle tile");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRegenerate = async () => {
    if (!playerToken) return;
    try {
      const result = await api.regenerateBoard(gameId, playerToken);
      setBoard(result.board);
      // Reset checks to only center
      const newChecks: Record<number, boolean> = {};
      for (let i = 0; i < 25; i++) newChecks[i] = i === 12;
      setChecks(newChecks);
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate board"
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  // Loading state
  if (!playerToken || !snapshot || !board) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading game...</p>
        </div>
      </main>
    );
  }

  const status = snapshot.status;
  const isLive = status === "live";
  const isEnded = status === "ended";
  const myPlace = snapshot.myPlace;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <WinnerToast winners={snapshot.winners} />
      {previewPlayer && (
        <BlurredPreview
          player={previewPlayer}
          onClose={() => setPreviewPlayer(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{snapshot.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isLive
                    ? "bg-green-100 text-green-700"
                    : isEnded
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {status.toUpperCase()}
              </span>
              {myPlace !== null && myPlace !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-400 text-yellow-900">
                  You placed {myPlace === 1 ? "1st" : myPlace === 2 ? "2nd" : myPlace === 3 ? "3rd" : `${myPlace}th`}!
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isEnded}
            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Regenerate Board
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded mb-3">
            {error}
          </p>
        )}

        {/* Game not started message */}
        {status === "lobby" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-yellow-800 font-medium">
              Waiting for host to start the game...
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              You can preview your board below. Tile clicking is enabled once
              the game starts.
            </p>
          </div>
        )}

        {isEnded && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-red-800 font-medium">Game has ended!</p>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_280px] gap-6">
          {/* Board */}
          <div>
            <GameBoard
              board={board}
              checks={checks}
              called={snapshot.called}
              isLive={isLive}
              onToggle={handleToggleTile}
            />
            <p className="text-center text-xs text-gray-400 mt-2">
              {snapshot.myCheckedCount ?? Object.values(checks).filter(Boolean).length}/25
              checked
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Called Words */}
            <div className="bg-white rounded-xl border p-4">
              <CalledWords
                words={snapshot.words || []}
                called={snapshot.called}
                isHost={false}
                onToggle={() => {}}
              />
            </div>

            {/* Roster */}
            <div className="bg-white rounded-xl border p-4">
              <Roster
                roster={snapshot.roster}
                myPlayerId={playerId || undefined}
                onPreview={setPreviewPlayer}
              />
            </div>

            {/* Winners */}
            {snapshot.winners.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-2">
                  Winners
                </h3>
                <div className="space-y-1.5">
                  {snapshot.winners.map((w) => (
                    <div
                      key={w.playerId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="font-bold">
                        {w.place === 1
                          ? "🥇"
                          : w.place === 2
                          ? "🥈"
                          : w.place === 3
                          ? "🥉"
                          : "🏆"}
                      </span>
                      <span
                        className={
                          w.playerId === playerId ? "font-bold text-blue-600" : ""
                        }
                      >
                        {w.name}
                        {w.playerId === playerId && " (you)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Widgets panel — auto-reloads on new deploy */}
          <div className="bg-white rounded-xl border overflow-hidden" style={{ height: 500 }}>
            <iframe
              key={widgetKey}
              src={`/${gameId}/play/widgets?name=${encodeURIComponent(playerName)}`}
              className="w-full h-full border-0"
              title="Widgets"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
