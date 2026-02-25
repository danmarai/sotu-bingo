import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";

/**
 * Generate a random token (UUID-based for simplicity).
 */
export function generateToken(): string {
  return uuidv4() + "-" + uuidv4();
}

/**
 * Hash a token using SHA-256.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a token against a stored hash.
 */
export function verifyToken(token: string, storedHash: string): boolean {
  return hashToken(token) === storedHash;
}

/**
 * Extract bearer token from Authorization header.
 */
export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}
