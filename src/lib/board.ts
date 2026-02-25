import { v4 as uuidv4 } from "uuid";
import { Board, Tile, Word } from "./types";

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a random 5×5 bingo board from the word list.
 * - Pick 24 random words (shuffle + slice)
 * - Position 12 (center) is FREE
 */
export function generateBoard(words: Word[]): Board {
  if (words.length < 24) {
    throw new Error(`Need at least 24 words, got ${words.length}`);
  }

  const shuffled = shuffle([...words]);
  const picked = shuffled.slice(0, 24);

  const tiles: Tile[] = [];
  let wordIdx = 0;

  for (let pos = 0; pos < 25; pos++) {
    if (pos === 12) {
      tiles.push({
        pos: 12,
        canonical: null,
        display: "FREE",
        isFree: true,
      });
    } else {
      const word = picked[wordIdx++];
      tiles.push({
        pos,
        canonical: word.canonical,
        display: word.display,
        isFree: false,
      });
    }
  }

  return {
    boardId: uuidv4(),
    version: 1,
    tiles,
  };
}

/**
 * Create initial checks map with only center (pos 12) checked.
 */
export function initialChecks(): Record<number, boolean> {
  const checks: Record<number, boolean> = {};
  for (let i = 0; i < 25; i++) {
    checks[i] = i === 12; // only center is checked
  }
  return checks;
}
