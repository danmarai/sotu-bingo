import { v4 as uuidv4 } from "uuid";
import { getKV } from "./kv";
import { generateBoard, initialChecks } from "./board";
import { sanitizePhrases } from "./sanitize";
import { hasBingo } from "./win-detection";
import { generateToken, hashToken, verifyToken, extractBearerToken } from "./tokens";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";
import type {
  GameState,
  UISnapshot,
  PlayerSummary,
  CreateGameResponse,
  JoinGameResponse,
  ToggleTileResponse,
  RegenerateResponse,
  StartEndResponse,
  ToggleCalledResponse,
} from "./types";

// ── Helpers ──

async function loadGame(gameId: string): Promise<GameState> {
  const kv = getKV();
  const game = await kv.getGame(gameId);
  if (!game) throw new NotFoundError("Game not found");
  return game;
}

async function saveGame(game: GameState): Promise<void> {
  const kv = getKV();
  await kv.setGame(game.gameId, game);
}

function requireHost(game: GameState, authHeader: string | null): void {
  const token = extractBearerToken(authHeader);
  if (!token) throw new UnauthorizedError();
  if (!verifyToken(token, game.hostTokenHash)) {
    throw new UnauthorizedError("Invalid host token");
  }
}

function requirePlayer(
  game: GameState,
  authHeader: string | null
): string {
  const token = extractBearerToken(authHeader);
  if (!token) throw new UnauthorizedError();

  for (const [playerId, hash] of Object.entries(game.playerTokenHashes)) {
    if (verifyToken(token, hash)) return playerId;
  }
  throw new UnauthorizedError("Invalid player token");
}

/** Build a UISnapshot from game state, optionally for a specific player */
export function buildSnapshot(
  game: GameState,
  forPlayerId?: string,
  isHost?: boolean
): UISnapshot {
  const roster: PlayerSummary[] = Object.values(game.players).map((p) => ({
    playerId: p.playerId,
    name: p.name,
    checkedCount: p.checkedCount,
    place: p.place,
    miniChecks: Array.from({ length: 25 }, (_, i) =>
      i === 12 ? true : p.checks[i] === true
    ),
  }));

  const snapshot: UISnapshot = {
    gameId: game.gameId,
    title: game.title,
    status: game.status,
    called: game.called,
    winners: game.winners,
    roster,
    version: game.version,
  };

  if (forPlayerId && game.players[forPlayerId]) {
    const player = game.players[forPlayerId];
    snapshot.myBoard = player.board;
    snapshot.myChecks = player.checks;
    snapshot.myCheckedCount = player.checkedCount;
    snapshot.myPlace = player.place;
  }

  if (isHost) {
    snapshot.words = game.words;
  }

  return snapshot;
}

// ── Game Operations ──

export async function createGame(
  title: string,
  phrasesRaw: string,
  baseUrl: string
): Promise<CreateGameResponse> {
  const trimmedTitle = (title || "").trim() || "SOTU Bingo";
  const result = sanitizePhrases(phrasesRaw);

  if (result.error) {
    throw new BadRequestError(result.error);
  }

  const gameId = uuidv4();
  const hostToken = generateToken();
  const hostTokenHash = hashToken(hostToken);

  const game: GameState = {
    gameId,
    title: trimmedTitle,
    status: "lobby",
    createdAt: Date.now(),
    maxPlayers: 10,
    words: result.words,
    called: [],
    nextPlace: 1,
    winners: [],
    players: {},
    hostTokenHash,
    playerTokenHashes: {},
    version: 1,
  };

  await saveGame(game);

  return {
    gameId,
    hostToken,
    joinUrl: `${baseUrl}/${gameId}`,
  };
}

export async function startGame(
  gameId: string,
  authHeader: string | null
): Promise<StartEndResponse> {
  const game = await loadGame(gameId);
  requireHost(game, authHeader);

  if (game.status !== "lobby") {
    throw new BadRequestError(`Cannot start game in "${game.status}" status`);
  }

  game.status = "live";
  game.version++;
  await saveGame(game);

  return { status: game.status, version: game.version };
}

export async function endGame(
  gameId: string,
  authHeader: string | null
): Promise<StartEndResponse> {
  const game = await loadGame(gameId);
  requireHost(game, authHeader);

  if (game.status === "ended") {
    throw new BadRequestError("Game already ended");
  }

  game.status = "ended";
  game.version++;
  await saveGame(game);

  return { status: game.status, version: game.version };
}

export async function joinGame(
  gameId: string,
  name: string
): Promise<JoinGameResponse> {
  const game = await loadGame(gameId);

  if (game.status === "ended") {
    throw new ForbiddenError("Game has ended");
  }

  const trimmedName = (name || "").trim();
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    throw new BadRequestError("Name must be 2–20 characters");
  }

  // Check duplicate name (case-insensitive)
  const nameLower = trimmedName.toLowerCase();
  for (const p of Object.values(game.players)) {
    if (p.name.toLowerCase() === nameLower) {
      throw new ConflictError("Name already taken");
    }
  }

  // Check max players
  if (Object.keys(game.players).length >= game.maxPlayers) {
    throw new ConflictError("Game is full (max 10 players)");
  }

  const playerId = uuidv4();
  const playerToken = generateToken();
  const board = generateBoard(game.words);
  const checks = initialChecks();

  game.players[playerId] = {
    playerId,
    name: trimmedName,
    joinedAt: Date.now(),
    board,
    checks,
    checkedCount: 1, // center is checked
    place: null,
  };

  game.playerTokenHashes[playerId] = hashToken(playerToken);
  game.version++;
  await saveGame(game);

  return {
    playerId,
    playerToken,
    board,
    gameSnapshot: buildSnapshot(game, playerId),
  };
}

export async function toggleTile(
  gameId: string,
  authHeader: string | null,
  pos: number,
  checked: boolean
): Promise<ToggleTileResponse> {
  const game = await loadGame(gameId);
  const playerId = requirePlayer(game, authHeader);

  if (game.status !== "live") {
    throw new ForbiddenError("Game is not live");
  }

  if (pos < 0 || pos > 24 || !Number.isInteger(pos)) {
    throw new BadRequestError("Invalid tile position (0–24)");
  }

  // Center tile cannot be unchecked
  if (pos === 12) {
    throw new BadRequestError("Cannot modify the FREE center tile");
  }

  const player = game.players[playerId];
  player.checks[pos] = checked;

  // Recount
  player.checkedCount = Object.values(player.checks).filter(Boolean).length;

  // Check for win
  let didWin = false;
  let placeAssigned: number | null = null;

  if (checked && player.place === null && hasBingo(player.checks)) {
    player.place = game.nextPlace;
    placeAssigned = game.nextPlace;
    game.winners.push({
      playerId,
      name: player.name,
      place: game.nextPlace,
      wonAt: Date.now(),
    });
    game.nextPlace++;
    didWin = true;
  }

  game.version++;
  await saveGame(game);

  return {
    checkedCount: player.checkedCount,
    didWin,
    placeAssigned,
    version: game.version,
  };
}

export async function regenerateBoard(
  gameId: string,
  authHeader: string | null
): Promise<RegenerateResponse> {
  const game = await loadGame(gameId);
  const playerId = requirePlayer(game, authHeader);

  if (game.status === "ended") {
    throw new ForbiddenError("Game has ended");
  }

  const player = game.players[playerId];
  player.board = generateBoard(game.words);
  player.checks = initialChecks();
  player.checkedCount = 1; // center only

  game.version++;
  await saveGame(game);

  return {
    board: player.board,
    checkedCount: player.checkedCount,
    version: game.version,
  };
}

export async function toggleCalled(
  gameId: string,
  authHeader: string | null,
  canonical: string,
  called: boolean
): Promise<ToggleCalledResponse> {
  const game = await loadGame(gameId);
  requireHost(game, authHeader);

  // Validate canonical exists in word list
  const exists = game.words.some((w) => w.canonical === canonical);
  if (!exists) {
    throw new BadRequestError("Word not in game's phrase list");
  }

  if (called) {
    if (!game.called.includes(canonical)) {
      game.called.push(canonical);
    }
  } else {
    game.called = game.called.filter((c) => c !== canonical);
  }

  game.version++;
  await saveGame(game);

  return { called: game.called, version: game.version };
}

export async function pollGame(
  gameId: string,
  sinceVersion: number,
  authHeader: string | null
): Promise<{ noChange: boolean; version: number; snapshot?: UISnapshot }> {
  const game = await loadGame(gameId);

  if (game.version <= sinceVersion) {
    return { noChange: true, version: game.version };
  }

  // Determine if requester is a player
  let playerId: string | undefined;
  let isHost = false;

  const token = extractBearerToken(authHeader);
  if (token) {
    // Check if host
    if (verifyToken(token, game.hostTokenHash)) {
      isHost = true;
    }
    // Check if player
    for (const [pid, hash] of Object.entries(game.playerTokenHashes)) {
      if (verifyToken(token, hash)) {
        playerId = pid;
        break;
      }
    }
  }

  return {
    noChange: false,
    version: game.version,
    snapshot: buildSnapshot(game, playerId, isHost),
  };
}
