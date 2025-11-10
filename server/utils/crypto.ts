import crypto from "crypto";

export function hashPIN(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(pin, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPIN(pin: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const pinHash = crypto.pbkdf2Sync(pin, salt, 10000, 64, "sha512").toString("hex");
  return hash === pinHash;
}
