import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { AuthOptions } from "next-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await axios.post(`${API_URL}/auth/login`, credentials, {
            headers: { "Content-Type": "application/json" },
          });

          if (res.status === 200 && res.data.user) {
            return { ...res.data.user, token: res.data.token };
          }
          return null;
        } catch (error: any) {
          if (axios.isAxiosError(error) && error.response) {
            console.error("Auth error details:", error.response.data);
            throw new Error(
              error.response.data.error || "Authentication failed",
            );
          }
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const res = await axios.post(`${API_URL}/auth/google-auth`, {
            email: user.email,
            name: user.name,
            providerId: user.id,
          });

          if (res.status === 200 && res.data.token) {
            (user as any).token = res.data.token;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Google auth error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
