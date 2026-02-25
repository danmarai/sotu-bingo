"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Polls /api/ui-version every 30s.
 * Returns a `widgetKey` that changes when a new deploy is detected,
 * causing the widget iframe to remount and load fresh code.
 */
export function useWidgetVersion() {
  const [widgetKey, setWidgetKey] = useState(0);
  const lastVersion = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const check = async () => {
      try {
        const res = await fetch("/api/ui-version");
        if (!res.ok) return;
        const data = await res.json();
        const version = data.version as string;

        if (lastVersion.current === null) {
          // First check — just record the version
          lastVersion.current = version;
        } else if (version !== lastVersion.current) {
          // New deploy detected — bump the key to reload widgets
          lastVersion.current = version;
          setWidgetKey((k) => k + 1);
        }
      } catch {
        // ignore
      }
    };

    check();
    timer = setInterval(check, 30_000);

    return () => clearInterval(timer);
  }, []);

  return { widgetKey };
}
