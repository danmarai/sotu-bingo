import { sanitizePhrases } from "@/lib/sanitize";
import { generateBoard, initialChecks } from "@/lib/board";
import { hasBingo, WINNING_LINES } from "@/lib/win-detection";
import { generateToken, hashToken, verifyToken } from "@/lib/tokens";

// ── Helper: generate N unique phrases ──
function makePhrases(n: number): string {
  return Array.from({ length: n }, (_, i) => `Phrase ${i + 1}`).join("\n");
}

// ══════════════════════════════════════
// SANITIZER TESTS
// ══════════════════════════════════════
describe("sanitizePhrases", () => {
  test("accepts exactly 24 unique phrases", () => {
    const result = sanitizePhrases(makePhrases(24));
    expect(result.error).toBeUndefined();
    expect(result.words).toHaveLength(24);
    expect(result.removedDuplicates).toBe(0);
  });

  test("accepts 50 unique phrases", () => {
    const result = sanitizePhrases(makePhrases(50));
    expect(result.error).toBeUndefined();
    expect(result.words).toHaveLength(50);
  });

  test("rejects fewer than 24 unique phrases", () => {
    const result = sanitizePhrases(makePhrases(23));
    expect(result.error).toMatch(/not enough/i);
    expect(result.words).toHaveLength(23);
  });

  test("rejects more than 50 phrases", () => {
    const result = sanitizePhrases(makePhrases(51));
    expect(result.error).toMatch(/too many/i);
    expect(result.words).toHaveLength(50); // truncated
  });

  test("removes duplicates case-insensitively", () => {
    const input = "Hello\nhello\nHELLO\nWorld\n" + makePhrases(23);
    const result = sanitizePhrases(input);
    expect(result.removedDuplicates).toBe(2);
    // "Hello" should be preserved (first-seen casing)
    expect(result.words[0].display).toBe("Hello");
    expect(result.words[0].canonical).toBe("hello");
  });

  test("trims whitespace and removes empty lines", () => {
    const lines = Array.from({ length: 24 }, (_, i) => `  Phrase ${i + 1}  `);
    lines.splice(5, 0, "", "  ", "\t");
    const result = sanitizePhrases(lines.join("\n"));
    expect(result.error).toBeUndefined();
    expect(result.words).toHaveLength(24);
    expect(result.words[0].display).toBe("Phrase 1");
  });
});

// ══════════════════════════════════════
// BOARD GENERATION TESTS
// ══════════════════════════════════════
describe("generateBoard", () => {
  const words = sanitizePhrases(makePhrases(30)).words;

  test("generates a 25-tile board", () => {
    const board = generateBoard(words);
    expect(board.tiles).toHaveLength(25);
  });

  test("center tile (pos 12) is FREE", () => {
    const board = generateBoard(words);
    const center = board.tiles.find((t) => t.pos === 12);
    expect(center).toBeDefined();
    expect(center!.isFree).toBe(true);
    expect(center!.display).toBe("FREE");
    expect(center!.canonical).toBeNull();
  });

  test("all non-free tiles have valid phrases", () => {
    const board = generateBoard(words);
    const nonFree = board.tiles.filter((t) => !t.isFree);
    expect(nonFree).toHaveLength(24);
    for (const tile of nonFree) {
      expect(tile.canonical).toBeTruthy();
      expect(tile.display).toBeTruthy();
    }
  });

  test("no duplicate phrases on a single board", () => {
    const board = generateBoard(words);
    const canonicals = board.tiles
      .filter((t) => !t.isFree)
      .map((t) => t.canonical);
    expect(new Set(canonicals).size).toBe(24);
  });

  test("two boards are likely different (randomness)", () => {
    const b1 = generateBoard(words);
    const b2 = generateBoard(words);
    // Compare first tiles — extremely unlikely to be identical
    const tiles1 = b1.tiles.map((t) => t.canonical).join(",");
    const tiles2 = b2.tiles.map((t) => t.canonical).join(",");
    // Not a guarantee but extremely likely to differ
    expect(tiles1 === tiles2).toBe(false);
  });

  test("throws with fewer than 24 words", () => {
    const tooFew = words.slice(0, 20);
    expect(() => generateBoard(tooFew)).toThrow(/at least 24/);
  });
});

describe("initialChecks", () => {
  test("only center (pos 12) is checked", () => {
    const checks = initialChecks();
    expect(Object.keys(checks)).toHaveLength(25);
    expect(checks[12]).toBe(true);
    for (let i = 0; i < 25; i++) {
      if (i !== 12) expect(checks[i]).toBe(false);
    }
  });
});

// ══════════════════════════════════════
// WIN DETECTION TESTS
// ══════════════════════════════════════
describe("hasBingo", () => {
  test("no bingo with only center checked", () => {
    const checks: Record<number, boolean> = {};
    for (let i = 0; i < 25; i++) checks[i] = i === 12;
    expect(hasBingo(checks)).toBe(false);
  });

  test("detects horizontal bingo (middle row)", () => {
    const checks: Record<number, boolean> = {};
    for (let i = 0; i < 25; i++) checks[i] = false;
    // Row 2: positions 10, 11, 12, 13, 14
    checks[10] = true;
    checks[11] = true;
    checks[12] = true; // center (always true)
    checks[13] = true;
    checks[14] = true;
    expect(hasBingo(checks)).toBe(true);
  });

  test("detects vertical bingo (middle column)", () => {
    const checks: Record<number, boolean> = {};
    for (let i = 0; i < 25; i++) checks[i] = false;
    // Column 2: positions 2, 7, 12, 17, 22
    checks[2] = true;
    checks[7] = true;
    checks[12] = true;
    checks[17] = true;
    checks[22] = true;
    expect(hasBingo(checks)).toBe(true);
  });

  test("detects diagonal bingo (top-left to bottom-right)", () => {
    const checks: Record<number, boolean> = {};
    for (let i = 0; i < 25; i++) checks[i] = false;
    // Diagonal: 0, 6, 12, 18, 24
    checks[0] = true;
    checks[6] = true;
    checks[12] = true;
    checks[18] = true;
    checks[24] = true;
    expect(hasBingo(checks)).toBe(true);
  });

  test("detects diagonal bingo (top-right to bottom-left)", () => {
    const checks: Record<number, boolean> = {};
    for (let i = 0; i < 25; i++) checks[i] = false;
    // Diagonal: 4, 8, 12, 16, 20
    checks[4] = true;
    checks[8] = true;
    checks[12] = true;
    checks[16] = true;
    checks[20] = true;
    expect(hasBingo(checks)).toBe(true);
  });

  test("no bingo with 4 in a row", () => {
    const checks: Record<number, boolean> = {};
    for (let i = 0; i < 25; i++) checks[i] = false;
    checks[0] = true;
    checks[1] = true;
    checks[2] = true;
    checks[3] = true;
    // Missing checks[4]
    expect(hasBingo(checks)).toBe(false);
  });

  test("all 12 winning lines are defined", () => {
    expect(WINNING_LINES).toHaveLength(12);
    for (const line of WINNING_LINES) {
      expect(line).toHaveLength(5);
      for (const pos of line) {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(24);
      }
    }
  });
});

// ══════════════════════════════════════
// TOKEN TESTS
// ══════════════════════════════════════
describe("tokens", () => {
  test("generates unique tokens", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
    expect(t1.length).toBeGreaterThan(30);
  });

  test("hash is deterministic", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  test("verifyToken works correctly", () => {
    const token = generateToken();
    const hash = hashToken(token);
    expect(verifyToken(token, hash)).toBe(true);
    expect(verifyToken("wrong-token", hash)).toBe(false);
  });
});
