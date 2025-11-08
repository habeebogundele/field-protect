import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { storage } from "@/lib/storage";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await storage.getUserByEmail(credentials.email as string);
        
        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          throw new Error("Please sign in with Google");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          image: user.profileImageUrl,
          isAdmin: user.isAdmin,
          userRole: user.userRole,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          let existingUser = await storage.getUserByEmail(user.email!);
          
          if (!existingUser) {
            // Create new user from Google profile
            existingUser = await storage.createUser({
              email: user.email!,
              firstName: profile?.given_name || user.name?.split(' ')[0],
              lastName: profile?.family_name || user.name?.split(' ').slice(1).join(' '),
              profileImageUrl: user.image,
              userRole: 'farmer',
              subscriptionStatus: 'inactive',
              isAdmin: false,
            });
          }
          
          user.id = existingUser._id.toString();
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.userRole = user.userRole;
      }
      
      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.userRole = token.userRole as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
