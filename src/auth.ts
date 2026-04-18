import NextAuth, { DefaultSession, NextAuthConfig } from "next-auth";
import EntraID from "next-auth/providers/microsoft-entra-id";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      role?: string;
    } & DefaultSession["user"];
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    EntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "microsoft-entra-id") {
        // Enforce strict Microsoft 365 Tenant separation
        // Entra ID provides the tenant id in 'profile.tid'
        if (profile?.tid !== process.env.AZURE_AD_TENANT_ID) {
          console.error("Login attempt from unauthorized Microsoft 365 Tenant blocked.");
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, profile, account }) {
      // In Auth.js, user, profile, account are only passed on the first call after sign-in
      if (user && profile) {
        token.id = user.id;
        token.tid = profile.tid; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.tenantId = (token.tid as string) || null;
      }
      return session;
    },
  },
  // If we have an explicit sign-in page, we can route it here
  // pages: {
  //   signIn: '/login', // Adjust if needed
  // },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
