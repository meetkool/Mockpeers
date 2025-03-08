import NextAuth, { AuthOptions, DefaultSession, Session } from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { Provider } from '@prisma/client'
import bcrypt from 'bcryptjs'

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface ExtendedSession extends Session {
  user: {
    role?: string;
  } & DefaultSession["user"]
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: (context) => {
      if (context?.url?.includes('/admin')) {
        return '/admin/login'
      }
      return '/signup'
    },
  },
  providers: [
    // Admin Credentials Provider
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email }
        });

        if (!admin) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        );

        if (!isPasswordValid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'ADMIN'
        }
      }
    }),
    // User Email/Password Provider
    CredentialsProvider({
      id: 'user-login',
      name: 'Email Login',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: 'USER'
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ''
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'admin-login') return true;
      if (account?.provider === 'user-login') return true;

      try {
        const provider = account?.provider?.toUpperCase() as Provider;
        await prisma.user.upsert({
          where: { email: user.email ?? '' },
          update: {
            name: user.name,
            image: user.image,
            provider: provider,
          },
          create: {
            email: user.email ?? '',
            name: user.name,
            image: user.image,
            provider: provider,
          }
        });
      } catch (error) {
        console.error('Error in signIn callback:', error);
      }
      return true;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          role: token.role as string
        }
      }
    },
    async jwt({ token, user }): Promise<JWT & { role?: string }> {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
