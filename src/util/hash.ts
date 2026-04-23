import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(plain, salt, 64);
  const known = Buffer.from(hash, "hex");
  if (derived.length !== known.length) return false;
  return timingSafeEqual(derived, known);
}
