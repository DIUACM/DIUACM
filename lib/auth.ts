import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/drizzle";
import NextAuth, { Profile, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import Google from "@auth/core/providers/google";
import { users, accounts } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

const adapter = DrizzleAdapter(db);

// Function to generate a random username
const generateRandomUsername = (): string => {
  const adjectives = ['quick', 'brave', 'clever', 'bright', 'swift', 'bold', 'wise', 'cool', 'smart', 'fast'];
  const nouns = ['coder', 'hacker', 'dev', 'ninja', 'wizard', 'guru', 'master', 'pro', 'ace', 'star'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      profile(profile: Profile): User {
        return {
          id: profile.sub,
          name: profile.name,
          emailVerified: new Date(),
          email: profile.email,
          image: profile.picture,
        } as User;
      },
    }),
    Credentials({
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const validatedCredentials = loginSchema.safeParse(credentials);

        if (!validatedCredentials.success) return null;

        const { identifier, password } = validatedCredentials.data;

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            password: users.password,
          })
          .from(users)
          .where(
            or(
              eq(users.email, identifier),
              eq(users.username, identifier),
              eq(users.email, identifier.toLowerCase() as string),
              eq(users.username, identifier.toLowerCase() as string)
            )
          )
          .limit(1);

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password ?? "");
        return isValid ? user : null;
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        const email = profile?.email;

        // Check if email domain is allowed
        if (
          !email ||
          !(email.endsWith("@diu.edu.bd") || email.endsWith("@s.diu.edu.bd"))
        ) {
          return false;
        }

        // Check if there's an existing user with this email
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          // Check if user has a Google account linked
          const [existingAccount] = await db
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.userId, existingUser.id),
                eq(accounts.provider, "google")
              )
            )
            .limit(1);

          // If user exists but doesn't have a Google account linked,
          // we'll create the link
          if (!existingAccount) {
            await db.insert(accounts).values({
              userId: existingUser.id,
              type: account.type as "oauth",
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state?.toString(),
            });
          }
          // Set the user ID to the existing user's ID
          user.id = existingUser.id;
        } else {
          // For new users, we need to create the user manually with username
          const username = profile?.email?.split("@")[0] ?? generateRandomUsername();
          
          // Ensure required fields are not null
          if (!profile?.name || !profile?.email) {
            return false;
          }
          
          // Create the user manually to include username
          const [newUser] = await db.insert(users).values({
            name: profile.name,
            email: profile.email,
            emailVerified: new Date(),
            image: profile?.picture || null,
            username: username,
          }).returning({ id: users.id });

          // Set the user ID for the session
          user.id = newUser.id;
          
          // Create the account manually since we bypassed the adapter
          await db.insert(accounts).values({
            userId: newUser.id,
            type: account.type as "oauth",
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state?.toString(),
          });
          
          // The account will be created automatically by the adapter
          return true;
        }

        return true;
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginFormData = z.infer<typeof loginSchema>;
