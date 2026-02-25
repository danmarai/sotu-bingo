import { GameState } from "./types";

// ── KV Interface ──
export interface KVStore {
  getGame(gameId: string): Promise<GameState | null>;
  setGame(gameId: string, state: GameState): Promise<void>;
}

// ── In-Memory Store (local dev) ──
class InMemoryKV implements KVStore {
  private store = new Map<string, GameState>();

  async getGame(gameId: string): Promise<GameState | null> {
    return this.store.get(gameId) ?? null;
  }

  async setGame(gameId: string, state: GameState): Promise<void> {
    // Deep clone to avoid mutation issues
    this.store.set(gameId, JSON.parse(JSON.stringify(state)));
  }
}

// ── Vercel KV / Upstash Store ──
class VercelKV implements KVStore {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async command(...args: string[]): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      throw new Error(`KV error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.result;
  }

  async getGame(gameId: string): Promise<GameState | null> {
    const raw = (await this.command("GET", `game:${gameId}`)) as string | null;
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  }

  async setGame(gameId: string, state: GameState): Promise<void> {
    // Set with 24h TTL (86400 seconds)
    await this.command(
      "SET",
      `game:${gameId}`,
      JSON.stringify(state),
      "EX",
      "86400"
    );
  }
}

// ── Singleton factory ──
let instance: KVStore | null = null;

export function getKV(): KVStore {
  if (instance) return instance;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    instance = new VercelKV(url, token);
  } else {
    console.log("[KV] Using in-memory store (no KV_REST_API_URL set)");
    instance = new InMemoryKV();
  }

  return instance;
}
