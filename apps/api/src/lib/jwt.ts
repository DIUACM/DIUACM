import { sign, verify } from "hono/jwt";

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;
const ALG = "HS256";

export type AuthPayload = {
  sub: number;
  username: string;
  iat: number;
  exp: number;
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
  return (await verify(token, secret, ALG)) as unknown as AuthPayload;
};
