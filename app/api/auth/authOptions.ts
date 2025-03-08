import NextAuth, { AuthOptions, DefaultSession, Session } from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {z} from "zod"
import { prisma } from "@/lib/prisma"
import { Provider } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Define extended types
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

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  image: z.string(),
})

export const authOptions: AuthOptions = {
  pages: {
    signIn: '/admin/login', // custom login page
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email }
        });

        if (!admin) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        );

        if (!isPasswordValid) {
          return null
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'ADMIN'
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
    async signIn({ user, account, profile }) {
      try {
        if (!account || !profile) return true;
        
        const provider = account.provider.toUpperCase() as Provider;
        
        // Gets profession from URL parameters
        const searchParams = new URLSearchParams(window.location.search);
        const profession = searchParams.get('profession') || '';

        // Updates or creates user with profession
        await prisma.user.upsert({
          where: { email: user.email ?? '' },
          update: {
            name: user.name,
            image: user.image,
            provider: provider,
            profession: profession
          },
          create: {
            email: user.email ?? '',
            name: user.name,
            image: user.image,
            provider: provider,
            profession: profession
          }
        });

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return true;
      }
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
