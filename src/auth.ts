import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getDb } from "@/lib/server/db";
import { authAvailability } from "@/lib/server/environment";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  const availability = authAvailability();
  return {
    adapter: availability.configured ? PrismaAdapter(getDb()) : undefined,
    secret: availability.configured ? process.env.AUTH_SECRET : undefined,
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    providers: [
      ...(availability.providers.includes("google") ? [Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: false,
      })] : []),
      ...(availability.providers.includes("nodemailer") ? [Nodemailer({
        server: process.env.AUTH_EMAIL_SERVER,
        from: process.env.AUTH_EMAIL_FROM,
        maxAge: 15 * 60,
      })] : []),
    ],
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
    // Keep provider credentials and error causes out of application logs.
    logger: { error(error) { console.error("Authentication failed:", error.name); } },
  };
});
