// Validates a Google-issued OAuth ID token by calling Google's public
// tokeninfo endpoint. Google parses, verifies the signature and expiry, and
// returns the claims as JSON. Caller must still check `aud` and `email_verified`
// — the endpoint does NOT enforce those itself.

const TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

export type GoogleClaims = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  aud: string;
};

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

// tokeninfo returns string-typed fields for everything, including bool-like
// ones. Be explicit about the wire shape so the parsing below is obvious.
type TokeninfoResponse = {
  sub?: string;
  aud?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  exp?: string;
  error_description?: string;
};

export const verifyGoogleIdToken = async (
  idToken: string,
  expectedClientId: string,
): Promise<GoogleClaims> => {
  if (!expectedClientId) {
    throw new GoogleAuthError("GOOGLE_CLIENT_ID is not configured");
  }

  // POST the credential as a form body. Putting an ID token in the URL query
  // would land it in CF access logs, Workers Observability traces, and any
  // upstream proxy — bearer credentials shouldn't appear in URLs.
  const res = await fetch(TOKENINFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken }).toString(),
  });
  if (!res.ok) {
    throw new GoogleAuthError(`tokeninfo rejected token (${res.status})`);
  }

  const data = (await res.json()) as TokeninfoResponse;

  if (!data.sub || !data.email || !data.aud) {
    throw new GoogleAuthError("tokeninfo response missing required claims");
  }
  if (data.aud !== expectedClientId) {
    throw new GoogleAuthError("ID token aud does not match GOOGLE_CLIENT_ID");
  }
  if (data.email_verified !== "true") {
    throw new GoogleAuthError("Google reports email is not verified");
  }
  const expSec = data.exp ? Number(data.exp) : 0;
  if (!Number.isFinite(expSec) || expSec * 1000 <= Date.now()) {
    throw new GoogleAuthError("ID token is expired");
  }

  return {
    sub: data.sub,
    email: data.email,
    emailVerified: true,
    name: data.name ?? null,
    aud: data.aud,
  };
};
