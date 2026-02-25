"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameApi } from "@/hooks/use-game-api";
import { usePolling } from "@/hooks/use-polling";
import type { UISnapshot } from "@/lib/types";

export default function JoinPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const api = useGameApi();
  const gameId = params.gameId;

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [snapshot, setSnapshot] = useState<UISnapshot | null>(null);

  // Check if already joined
  useEffect(() => {
    const token = localStorage.getItem(`player:${gameId}`);
    if (token) {
      router.replace(`/${gameId}/play`);
    }
  }, [gameId, router]);

  const onSnapshot = useCallback((snap: UISnapshot) => {
    setSnapshot(snap);
  }, []);

  // Poll to show game status on join screen
  usePolling({
    gameId,
    token: null,
    enabled: true,
    onSnapshot,
  });

  const handleJoin = async () => {
    setError("");
    setJoining(true);
    try {
      const result = await api.joinGame(gameId, name);

      // Save credentials to localStorage
      localStorage.setItem(`player:${gameId}`, result.playerToken);
      localStorage.setItem(`playerId:${gameId}`, result.playerId);
      localStorage.setItem(`playerName:${gameId}`, name);

      router.push(`/${gameId}/play`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
      setJoining(false);
    }
  };

  const status = snapshot?.status || "loading...";
  const playerCount = snapshot?.roster?.length || 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-sm w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1">
            {snapshot?.title || "Bingo"}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                status === "live"
                  ? "bg-green-100 text-green-700"
                  : status === "ended"
                  ? "bg-red-100 text-red-700"
                  : status === "lobby"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {typeof status === "string"
                ? status.toUpperCase()
                : "LOADING..."}
            </span>
            <span className="text-xs text-gray-400">
              {playerCount}/10 players
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          {status === "ended" ? (
            <p className="text-red-500 text-center font-medium">
              This game has ended.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    name.trim().length >= 2 &&
                    handleJoin()
                  }
                  maxLength={20}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter your name (2–20 chars)"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  {name.trim().length}/20 characters
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">
                  {error}
                </p>
              )}

              <button
                onClick={handleJoin}
                disabled={
                  name.trim().length < 2 || name.trim().length > 20 || joining
                }
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {joining ? "Joining..." : "Join Game"}
              </button>
            </>
          )}
        </div>

        {/* Show current players */}
        {snapshot?.roster && snapshot.roster.length > 0 && (
          <div className="mt-4 bg-white rounded-xl border p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Players in game:
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.roster.map((p) => (
                <span
                  key={p.playerId}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
