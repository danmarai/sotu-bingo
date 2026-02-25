"use client";

import { useState, useCallback } from "react";
import { useGameApi } from "@/hooks/use-game-api";
import { usePolling } from "@/hooks/use-polling";
import { Roster } from "@/components/Roster";
import { CalledWords } from "@/components/CalledWords";
import { BlurredPreview } from "@/components/BlurredPreview";
import { WinnerToast } from "@/components/WinnerToast";
import type { UISnapshot, PlayerSummary } from "@/lib/types";

const DEFAULT_PHRASES = `Inflation
Border Security
Unity
Bipartisan
Democracy
Freedom
Economy
Healthcare
Education
Climate Change
Jobs
Infrastructure
Immigration
National Security
Tax Cuts
Social Security
Medicare
Veterans
China
Russia
Middle Class
Small Business
Gun Violence
Fentanyl`;

export default function HostPage() {
  const api = useGameApi();

  // Setup state
  const [title, setTitle] = useState("SOTU Bingo");
  const [phrases, setPhrases] = useState(DEFAULT_PHRASES);
  const [error, setError] = useState("");

  // Game state
  const [gameId, setGameId] = useState<string | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<UISnapshot | null>(null);
  const [copied, setCopied] = useState(false);

  // Preview modal
  const [previewPlayer, setPreviewPlayer] = useState<PlayerSummary | null>(
    null
  );

  // Phrase count
  const lines = phrases
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const uniqueLines = new Set(lines.map((l) => l.toLowerCase()));

  const onSnapshot = useCallback((snap: UISnapshot) => {
    setSnapshot(snap);
  }, []);

  const { refresh } = usePolling({
    gameId: gameId || "",
    token: hostToken,
    enabled: !!gameId,
    onSnapshot,
  });

  const handleCreate = async () => {
    setError("");
    try {
      const result = await api.createGame(title, phrases);
      setGameId(result.gameId);
      setHostToken(result.hostToken);
      setJoinUrl(result.joinUrl);

      // Save to localStorage
      localStorage.setItem(`host:${result.gameId}`, result.hostToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    }
  };

  const handleStart = async () => {
    if (!gameId || !hostToken) return;
    setError("");
    try {
      await api.startGame(gameId, hostToken);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  };

  const handleEnd = async () => {
    if (!gameId || !hostToken) return;
    try {
      await api.endGame(gameId, hostToken);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end game");
    }
  };

  const handleToggleCalled = async (canonical: string, called: boolean) => {
    if (!gameId || !hostToken) return;
    try {
      await api.toggleCalled(gameId, hostToken, canonical, called);
      refresh();
    } catch {
      // ignore
    }
  };

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Setup Screen ──
  if (!gameId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center mb-2">🎯 SOTU Bingo</h1>
          <p className="text-gray-500 text-center mb-8">
            Create a multiplayer bingo game
          </p>

          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="SOTU Bingo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phrases (one per line)
              </label>
              <textarea
                value={phrases}
                onChange={(e) => setPhrases(e.target.value)}
                rows={12}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                placeholder="Enter bingo phrases, one per line..."
              />
              <p
                className={`text-xs mt-1 ${
                  uniqueLines.size < 24
                    ? "text-red-500"
                    : uniqueLines.size > 50
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {uniqueLines.size} unique phrases (need 24–50)
                {lines.length !== uniqueLines.size &&
                  ` · ${lines.length - uniqueLines.size} duplicates removed`}
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <button
              onClick={handleCreate}
              disabled={uniqueLines.size < 24 || uniqueLines.size > 50}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Game
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Lobby / Live / Ended Screen (Host View) ──
  const status = snapshot?.status || "lobby";
  const isLive = status === "live";
  const isEnded = status === "ended";

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <WinnerToast winners={snapshot?.winners || []} />
      {previewPlayer && (
        <BlurredPreview
          player={previewPlayer}
          onClose={() => setPreviewPlayer(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{snapshot?.title || title}</h1>
            <div className="flex items-center gap-2 mt-1">
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
              <span className="text-xs text-gray-400">Host View</span>
            </div>
          </div>
          <div className="flex gap-2">
            {status === "lobby" && (
              <button
                onClick={handleStart}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Start Game
              </button>
            )}
            {isLive && (
              <button
                onClick={handleEnd}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                End Game
              </button>
            )}
          </div>
        </div>

        {/* Join link */}
        {joinUrl && (
          <div className="bg-white border rounded-lg p-4 mb-6 flex items-center gap-3">
            <span className="text-sm text-gray-500 shrink-0">Join link:</span>
            <code className="text-sm text-blue-600 truncate flex-1">
              {joinUrl}
            </code>
            <button
              onClick={handleCopyLink}
              className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-200 transition-colors shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded mb-4">
            {error}
          </p>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Called Words (host can toggle) */}
          <div className="bg-white rounded-xl border p-4">
            <CalledWords
              words={snapshot?.words || []}
              called={snapshot?.called || []}
              isHost={true}
              onToggle={handleToggleCalled}
            />
          </div>

          {/* Roster */}
          <div className="bg-white rounded-xl border p-4">
            <Roster
              roster={snapshot?.roster || []}
              onPreview={setPreviewPlayer}
            />
          </div>

          {/* Winners */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-2">
              Winners
            </h3>
            {(snapshot?.winners || []).length === 0 ? (
              <p className="text-gray-400 text-sm italic">No winners yet</p>
            ) : (
              <div className="space-y-2">
                {snapshot?.winners.map((w) => (
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
                    <span>{w.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
