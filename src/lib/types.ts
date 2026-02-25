// ── Word ──
export interface Word {
  canonical: string; // lowercase, trimmed
  display: string;   // original casing
}

// ── Tile ──
export interface Tile {
  pos: number;       // 0–24
  canonical: string | null; // null for FREE
  display: string;
  isFree: boolean;
}

// ── Board ──
export interface Board {
  boardId: string;
  version: number;
  tiles: Tile[]; // length 25, sorted by pos
}

// ── Player ──
export interface Player {
  playerId: string;
  name: string;
  joinedAt: number;
  board: Board;
  checks: Record<number, boolean>; // pos → checked
  checkedCount: number;
  place: number | null;
}

// ── Winner Record ──
export interface WinnerRecord {
  playerId: string;
  name: string;
  place: number;
  wonAt: number;
}

// ── Game Status ──
export type GameStatus = "lobby" | "live" | "ended";

// ── GameState (authoritative, stored in KV) ──
export interface GameState {
  gameId: string;
  title: string;
  status: GameStatus;
  createdAt: number;
  maxPlayers: number;

  words: Word[];
  called: string[]; // canonical strings

  nextPlace: number;
  winners: WinnerRecord[];

  players: Record<string, Player>; // playerId → Player

  hostTokenHash: string;
  playerTokenHashes: Record<string, string>; // playerId → hash

  version: number;
}

// ── UISnapshot (returned by poll, stripped of secrets) ──
export interface PlayerSummary {
  playerId: string;
  name: string;
  checkedCount: number;
  place: number | null;
  miniChecks: boolean[]; // 25 booleans for blurred preview
}

export interface UISnapshot {
  gameId: string;
  title: string;
  status: GameStatus;
  called: string[];
  winners: WinnerRecord[];
  roster: PlayerSummary[];
  // Only present for the requesting player:
  myBoard?: Board;
  myChecks?: Record<number, boolean>;
  myCheckedCount?: number;
  myPlace?: number | null;
  words?: Word[]; // included for host
  version: number;
}

// ── Poll Response ──
export interface PollResponse {
  noChange: boolean;
  version: number;
  snapshot?: UISnapshot;
}

// ── API Response types ──
export interface CreateGameResponse {
  gameId: string;
  hostToken: string;
  joinUrl: string;
}

export interface JoinGameResponse {
  playerId: string;
  playerToken: string;
  board: Board;
  gameSnapshot: UISnapshot;
}

export interface ToggleTileResponse {
  checkedCount: number;
  didWin: boolean;
  placeAssigned: number | null;
  version: number;
}

export interface RegenerateResponse {
  board: Board;
  checkedCount: number;
  version: number;
}

export interface StartEndResponse {
  status: GameStatus;
  version: number;
}

export interface ToggleCalledResponse {
  called: string[];
  version: number;
}
