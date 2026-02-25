import { Word } from "./types";

export interface SanitizeResult {
  words: Word[];
  removedDuplicates: number;
  error?: string;
}

/**
 * Sanitize raw phrase input (one phrase per line).
 * - Trim whitespace
 * - Remove empty lines
 * - De-dupe case-insensitively (preserve first-seen casing)
 * - Validate: need ≥ 24 unique, max 50
 */
export function sanitizePhrases(raw: string): SanitizeResult {
  const lines = raw.split("\n");
  const seen = new Map<string, Word>();
  let duplicates = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const canonical = trimmed.toLowerCase();
    if (seen.has(canonical)) {
      duplicates++;
      continue;
    }
    seen.set(canonical, { canonical, display: trimmed });
  }

  const words = Array.from(seen.values());

  if (words.length > 50) {
    return {
      words: words.slice(0, 50),
      removedDuplicates: duplicates,
      error: `Too many phrases (${words.length}). Max is 50.`,
    };
  }

  if (words.length < 24) {
    return {
      words,
      removedDuplicates: duplicates,
      error: `Not enough unique phrases (${words.length}). Need at least 24.`,
    };
  }

  return { words, removedDuplicates: duplicates };
}
