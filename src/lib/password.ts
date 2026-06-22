// Password hashing with PBKDF2 over the Web Crypto API — available globally on
// Cloudflare Workers, so no `nodejs_compat` or third-party dependency is needed.
// Stored format: `pbkdf2:<iterations>:<saltHex>:<hashHex>`.

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;

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
  const [scheme, iterStr, saltHex, hashHex] = stored.split(":");
  if (scheme !== "pbkdf2" || !iterStr || !saltHex || !hashHex) return false;

  const computed = await pbkdf2(password, hexToBytes(saltHex), parseInt(iterStr, 10));
  const expected = hexToBytes(hashHex);
  if (computed.length !== expected.length) return false;

  // Constant-time comparison.
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed[i] ^ expected[i];
  return diff === 0;
};
