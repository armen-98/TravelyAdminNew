import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Shape returned by POST /api/auth/sign-in
export interface ApiSignInResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: { id: number; name: string };
    isActive: boolean;
  };
  token: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        // The login page calls the API itself and passes these pre-resolved fields
        id: {},
        email: {},
        name: {},
        role: {},
        accessToken: {},
      },
      async authorize(credentials) {
        // credentials arrive already verified by the login page's direct API call.
        // We just validate the role and package the user for next-auth.
        if (!credentials?.accessToken || !credentials?.id) return null;

        const role = credentials.role as string;
        if (!["super-admin", "admin", "moderator"].includes(role)) return null;

        return {
          id: credentials.id as string,
          email: credentials.email as string,
          name: credentials.name as string,
          role,
          accessToken: credentials.accessToken as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}
