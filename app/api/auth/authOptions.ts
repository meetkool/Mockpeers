import NextAuth, { AuthOptions, DefaultSession, Session } from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
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
    id: string;
    role?: string;
  } & DefaultSession["user"]
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt", // Explicitly set JWT strategy
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
          },
        });

        if (!admin || !admin.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'ADMIN'
        };
      }
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'USER'
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'admin-login' || account?.provider === 'credentials') {
        return true; // Skip database operation for credential-based login
      }

      try {
        // Only perform upsert for OAuth providers (Google, GitHub)
        if (account?.provider) {
          const provider = account.provider.toUpperCase() as Provider;
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
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      // Ensure admin role is set correctly
      if (account?.provider === 'admin-login') {
        token.role = 'ADMIN';
      }
      return token;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub as string,
          role: token.role as string
        }
      }
    },
    async redirect({ url, baseUrl }) {
      // Normalize the URLs for comparison
      const normalizedUrl = url.toLowerCase();
      const normalizedBaseUrl = baseUrl.toLowerCase();

      // Handle admin routes
      if (normalizedUrl.includes('/admin')) {
        if (normalizedUrl.includes('/admin/login')) {
          return `${baseUrl}/admin`;
        }
        return url;
      }

      // Handle OAuth callbacks and login/signup
      if (
        normalizedUrl.includes('/api/auth/callback') ||
        normalizedUrl.includes('/login') ||
        normalizedUrl.includes('/signup')
      ) {
        return `${baseUrl}/dashboard`;
      }

      // Handle root redirects
      if (normalizedUrl === normalizedBaseUrl || normalizedUrl === `${normalizedBaseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }

      // Allow all other URLs that start with baseUrl
      if (normalizedUrl.startsWith(normalizedBaseUrl)) {
        return url;
      }

      return baseUrl;
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
