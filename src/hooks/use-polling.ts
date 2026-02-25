"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { UISnapshot } from "@/lib/types";

interface UsePollingOptions {
  gameId: string;
  token: string | null;
  enabled: boolean;
  onSnapshot: (snapshot: UISnapshot) => void;
}

export function usePolling({
  gameId,
  token,
  enabled,
  onSnapshot,
}: UsePollingOptions) {
  const versionRef = useRef(0);
  const [isPolling, setIsPolling] = useState(false);

  const poll = useCallback(async () => {
    if (!enabled || !gameId) return;

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/games/${gameId}/poll?sinceVersion=${versionRef.current}`,
        { headers }
      );

      if (!res.ok) return;

      const data = await res.json();

      if (!data.noChange && data.snapshot) {
        versionRef.current = data.version;
        onSnapshot(data.snapshot);
      } else if (data.version) {
        versionRef.current = data.version;
      }
    } catch {
      // Silently ignore poll errors
    }
  }, [gameId, token, enabled, onSnapshot]);

  // Force an immediate poll (e.g. after a local mutation)
  const refresh = useCallback(() => {
    poll();
  }, [poll]);

  // Reset version when gameId changes
  useEffect(() => {
    versionRef.current = 0;
  }, [gameId]);

  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    let timer: ReturnType<typeof setInterval>;
    let interval = 750; // ms

    const handleVisibilityChange = () => {
      clearInterval(timer);
      interval = document.hidden ? 3000 : 750;
      timer = setInterval(poll, interval);
    };

    // Initial poll
    poll();

    // Start polling
    timer = setInterval(poll, interval);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setIsPolling(false);
    };
  }, [enabled, poll]);

  return { isPolling, refresh };
}
