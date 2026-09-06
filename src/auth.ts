import NextAuth, { DefaultSession, NextAuthConfig } from "next-auth";
import EntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@prisma/client";

interface VelaDeskJwtFields {
  id?: string;
  tenantId?: string;
  role?: Role;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      role?: Role;
    } & DefaultSession["user"];
  }
}

export const authConfig: NextAuthConfig = {
  // HTTP first-run hosts (pi.local) are not in AUTH_URL. Without this, Auth.js
  // throws UntrustedHost on /api/auth/session even when staff use Magic Link.
  trustHost: true,
  providers: [
    EntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: process.env.AZURE_AD_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
        : undefined,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "microsoft-entra-id") {
        if (profile?.tid !== process.env.AZURE_AD_TENANT_ID) {
          console.error("Login attempt from unauthorized Microsoft 365 Tenant blocked.");
          return false;
        }

        if (!user.email) {
          console.error("[auth] Entra ID login missing email claim.");
          return false;
        }

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true },
        });

        if (!dbUser) {
          console.error(`[auth] Entra ID user ${user.email} not found in VelaDesk database.`);
          return false;
        }

        if (dbUser.role === "CUSTOMER") {
          console.error(`[auth] Customer ${user.email} cannot use agent SSO. Use the portal magic link.`);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const t = token as typeof token & VelaDeskJwtFields;
      if (account && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true, tenantId: true },
        });

        if (dbUser) {
          t.id = dbUser.id;
          t.tenantId = dbUser.tenantId;
          t.role = dbUser.role;
        }
      }

      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & VelaDeskJwtFields;
      if (session.user) {
        session.user.id = t.id ?? "";
        session.user.tenantId = t.tenantId ?? null;
        session.user.role = t.role;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
