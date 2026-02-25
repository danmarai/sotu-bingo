"use client";

import type {
  CreateGameResponse,
  JoinGameResponse,
  ToggleTileResponse,
  RegenerateResponse,
  StartEndResponse,
  ToggleCalledResponse,
} from "@/lib/types";

async function apiPost<T>(
  url: string,
  body?: unknown,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

export function useGameApi() {
  return {
    createGame: (title: string, phrases: string) =>
      apiPost<CreateGameResponse>("/api/games", { title, phrases }),

    startGame: (gameId: string, hostToken: string) =>
      apiPost<StartEndResponse>(
        `/api/games/${gameId}/start`,
        undefined,
        hostToken
      ),

    endGame: (gameId: string, hostToken: string) =>
      apiPost<StartEndResponse>(
        `/api/games/${gameId}/end`,
        undefined,
        hostToken
      ),

    joinGame: (gameId: string, name: string) =>
      apiPost<JoinGameResponse>(`/api/games/${gameId}/join`, { name }),

    toggleTile: (
      gameId: string,
      playerToken: string,
      pos: number,
      checked: boolean
    ) =>
      apiPost<ToggleTileResponse>(
        `/api/games/${gameId}/tile`,
        { pos, checked },
        playerToken
      ),

    regenerateBoard: (gameId: string, playerToken: string) =>
      apiPost<RegenerateResponse>(
        `/api/games/${gameId}/regenerate`,
        undefined,
        playerToken
      ),

    toggleCalled: (
      gameId: string,
      hostToken: string,
      canonical: string,
      called: boolean
    ) =>
      apiPost<ToggleCalledResponse>(
        `/api/games/${gameId}/called`,
        { canonical, called },
        hostToken
      ),
  };
}
