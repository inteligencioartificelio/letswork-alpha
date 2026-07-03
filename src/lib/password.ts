import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;
const SALT_LEN = 16;
const SCRYPT_N = 16384;

/** Hash a password using scrypt. Returns "scrypt:saltHex:hashHex". */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N });
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Verify a password against a stored "scrypt:salt:hash" string. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const hash = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N });
  if (hash.length !== expected.length) return false;
  return timingSafeEqual(hash, expected);
}
