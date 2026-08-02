import { sign, verify } from "hono/jwt";

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;
const ALG = "HS256";

export type AuthPayload = {
  sub: number;
  username: string;
  iat: number;
  exp: number;
};

const isAuthPayload = (value: unknown): value is AuthPayload => {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.sub === "number" &&
    Number.isInteger(payload.sub) &&
    payload.sub > 0 &&
    typeof payload.username === "string" &&
    payload.username.length > 0 &&
    typeof payload.iat === "number" &&
    Number.isInteger(payload.iat) &&
    typeof payload.exp === "number" &&
    Number.isInteger(payload.exp) &&
    payload.exp > payload.iat
  );
};

export const signAuthToken = async (
  user: { id: number; username: string },
  secret: string,
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthPayload = {
    sub: user.id,
    username: user.username,
    iat: now,
    exp: now + SEVEN_DAYS_SECONDS,
  };
  return sign(payload, secret, ALG);
};

export const verifyAuthToken = async (
  token: string,
  secret: string,
): Promise<AuthPayload> => {
  // hono/jwt's `verify` needs the algorithm as the third argument.
  const payload: unknown = await verify(token, secret, ALG);
  if (!isAuthPayload(payload)) throw new Error("Invalid auth token payload");
  return payload;
};
