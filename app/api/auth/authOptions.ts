import NextAuth, { AuthOptions, DefaultSession, Session } from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"
import { Provider } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Extend the built-in session types
interface ExtendedUser {
  id: string;
  email: string | null;
  name: string | null;
  role?: string;
  isPhoneVerified?: boolean;
  image?: string | null;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    role?: string;
    isPhoneVerified?: boolean;
  } & DefaultSession["user"]
}

// Extend JWT type
interface ExtendedJWT extends JWT {
  id: string;
  role?: string;
  isPhoneVerified: boolean | undefined;
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
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
        console.log('🔐 Admin login attempt:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
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
          console.log('❌ Admin not found or no password');
          throw new Error("Invalid credentials");
        }

        console.log('✅ Admin found:', admin.email);

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        );

        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('❌ Invalid password');
          throw new Error("Invalid credentials");
        }

        console.log('✅ Admin login successful');
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
      try {
        if (account?.provider === 'admin-login' || account?.provider === 'credentials') {
          return true;
        }

        // For OAuth providers (Google, GitHub)
        if (account?.provider && user.email) {
          const provider = account.provider.toUpperCase() as Provider;
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, isPhoneVerified: true }
          });

          if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || null,
                image: user.image || null,
                provider: provider,
              },
              select: {
                id: true,
                isPhoneVerified: true,
              }
            });
            (user as ExtendedUser).id = updatedUser.id;
            (user as ExtendedUser).isPhoneVerified = updatedUser.isPhoneVerified;
          } else {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                provider: provider,
                isPhoneVerified: false,
              },
              select: {
                id: true,
                isPhoneVerified: true,
              }
            });
            (user as ExtendedUser).id = newUser.id;
            (user as ExtendedUser).isPhoneVerified = newUser.isPhoneVerified;
          }
          return true;
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, trigger }): Promise<ExtendedJWT> {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as ExtendedUser).role,
          isPhoneVerified: (user as ExtendedUser).isPhoneVerified
        };
      }
      
      // Re-fetch user data from database when session is updated
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isPhoneVerified: true }
        });
        
        if (dbUser) {
          return {
            ...token,
            id: token.id as string,
            role: token.role as string | undefined,
            isPhoneVerified: dbUser.isPhoneVerified
          };
        }
      }
      
      return {
        ...token,
        id: token.id as string,
        role: token.role as string | undefined,
        isPhoneVerified: token.isPhoneVerified as boolean | undefined
      };
    },
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role,
          isPhoneVerified: token.isPhoneVerified as boolean | undefined
        }
      };
    },
    async redirect({ 
      url, 
      baseUrl, 
      token 
    }: { 
      url: string; 
      baseUrl: string; 
      token?: ExtendedJWT 
    }) {
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

      // For OAuth and regular sign-in - always go to dashboard
      if (normalizedUrl.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard`;
      }

      // If user is signing in, go to dashboard
      if (normalizedUrl.includes('/login') || normalizedUrl.includes('/signup')) {
        return `${baseUrl}/dashboard`;
      }

      // Default redirects
      if (normalizedUrl === normalizedBaseUrl || normalizedUrl === `${normalizedBaseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }

      return url;
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
