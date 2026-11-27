import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/features/auth/schemas";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const matches = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!matches) {
          return null;
        }

        return {
          sessionVersion: user.sessionVersion,
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return account?.provider === "credentials";
      if (profile?.email_verified !== true || typeof profile.email !== "string" || !account.providerAccountId) return false;
      const existing = await prisma.user.findUnique({ where: { googleSubject: account.providerAccountId } });
      if (existing) return true;
      const email = profile.email.trim().toLowerCase();
      // Never silently link an existing password account by email.
      if (await prisma.user.findUnique({ where: { email } })) return false;
      try {
        await prisma.user.create({ data: {
          googleSubject: account.providerAccountId,
          email,
          name: typeof profile.name === "string" && profile.name.trim() ? profile.name : email,
          passwordHash: "",
          emailVerifiedAt: new Date(),
        } });
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        const local = await prisma.user.findUnique({ where: { googleSubject: account.providerAccountId } });
        if (!local) return null;
        token.userId = local.id;
        token.sessionVersion = local.sessionVersion;
        token.absoluteExpiresAt = Date.now() + SESSION_MAX_AGE * 1000;
        return token;
      }
      if (user) {
        token.userId = user.id;
        token.sessionVersion = user.sessionVersion;
        token.absoluteExpiresAt = Date.now() + SESSION_MAX_AGE * 1000;
        return token;
      }

      if (typeof token.userId !== "string" || typeof token.sessionVersion !== "number") {
        return null;
      }
      if (typeof token.absoluteExpiresAt !== "number" || !Number.isFinite(token.absoluteExpiresAt) || token.absoluteExpiresAt <= Date.now()) return null;
      const current = await prisma.user.findUnique({
        where: { id: token.userId },
        select: { sessionVersion: true },
      });
      if (!current || current.sessionVersion !== token.sessionVersion) {
        return null;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      return session;
    },
  },
});
