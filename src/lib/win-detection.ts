/**
 * All 12 winning lines for a 5×5 bingo grid.
 * Positions are 0–24, row-major:
 *   0  1  2  3  4
 *   5  6  7  8  9
 *  10 11 12 13 14
 *  15 16 17 18 19
 *  20 21 22 23 24
 */
export const WINNING_LINES: number[][] = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

/**
 * Check if the given checks map contains a winning line.
 * Position 12 (center/FREE) is always considered checked.
 */
export function hasBingo(checks: Record<number, boolean>): boolean {
  for (const line of WINNING_LINES) {
    const complete = line.every(
      (pos) => pos === 12 || checks[pos] === true
    );
    if (complete) return true;
  }
  return false;
}
