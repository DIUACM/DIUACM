import { compare as compareBcrypt } from "bcryptjs";

// New passwords use PBKDF2 over the Web Crypto API, available globally on
// Cloudflare Workers without `nodejs_compat`. Stored format:
// `pbkdf2:<iterations>:<saltHex>:<hashHex>`.

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;
const BCRYPT_HASH = /^\$2[aby]\$(?:0[4-9]|1[0-5])\$[./A-Za-z0-9]{53}$/;

const bytesToHex = (bytes: Uint8Array): string =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

const hexToBytes = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const pbkdf2 = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    DERIVED_BITS,
  );
  return new Uint8Array(bits);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${bytesToHex(salt)}:${bytesToHex(hash)}`;
};

export const verifyPassword = async (
  password: string,
  stored: string,
): Promise<boolean> => {
  // Imported Laravel accounts use bcrypt (normally the `$2y$` variant).
  // bcryptjs is Worker-compatible and accepts $2a$, $2b$, and $2y$ hashes.
  if (BCRYPT_HASH.test(stored)) {
    try {
      return await compareBcrypt(password, stored);
    } catch {
      return false;
    }
  }

  const [scheme, iterStr, saltHex, hashHex] = stored.split(":");
  if (scheme !== "pbkdf2" || !iterStr || !saltHex || !hashHex) return false;

  const iterations = Number.parseInt(iterStr, 10);
  if (!Number.isSafeInteger(iterations) || iterations <= 0) return false;

  const computed = await pbkdf2(password, hexToBytes(saltHex), iterations);
  const expected = hexToBytes(hashHex);
  if (computed.length !== expected.length) return false;

  // Constant-time comparison.
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed[i] ^ expected[i];
  return diff === 0;
};

/** True when a supported hash should be upgraded to the current PBKDF2 format. */
export const needsPasswordRehash = (stored: string): boolean => {
  if (BCRYPT_HASH.test(stored)) return true;
  const [scheme, iterStr] = stored.split(":");
  if (scheme !== "pbkdf2" || !iterStr) return false;
  const iterations = Number.parseInt(iterStr, 10);
  return Number.isSafeInteger(iterations) && iterations > 0 && iterations < PBKDF2_ITERATIONS;
};
