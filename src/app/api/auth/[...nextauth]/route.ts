import NextAuth, { type AuthOptions } from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'

type AppUser = { id: string; email: string; accessToken: string; exp: number; roles?: string[] }
interface LoginResponse { access_token: string; exp: number; roles?: string[] }
type ExtendedToken = JWT & { accessToken?: string; exp?: number; roles?: string[] }

enum AuthProviderName { Credentials = 'Credentials' }

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: AuthProviderName.Credentials,
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'action', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const base =
          process.env.BACKEND_API_BASE ||
          process.env.NEXT_PUBLIC_API_BASE ||
          'http://localhost:8000'
        const action = credentials.action === 'signup' ? 'signup' : 'login'
        const url = `${base.replace(/\/$/, '')}/auth/${action}`
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        })
        if (!resp.ok) return null
        const data = (await resp.json().catch(() => null)) as LoginResponse | null
        if (!data?.access_token) return null
        const user: AppUser = {
          id: credentials.email,
          email: credentials.email,
          accessToken: data.access_token,
          exp: data.exp,
          roles: data.roles,
        }
        return user
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as ExtendedToken
      if (user) {
        const u = user as unknown as AppUser
        t.accessToken = u.accessToken
        t.roles = u.roles
        t.exp = u.exp
      } else if (t.exp && Date.now() / 1000 > t.exp - 60 && t.accessToken) {
        const base =
          process.env.BACKEND_API_BASE ||
          process.env.NEXT_PUBLIC_API_BASE ||
          'http://localhost:8000'
        const url = `${base.replace(/\/$/, '')}/auth/refresh`
        const resp = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t.accessToken}` },
        })
        if (resp.ok) {
          const data = (await resp.json().catch(() => null)) as LoginResponse | null
          if (data?.access_token) {
            t.accessToken = data.access_token
            t.exp = data.exp
            t.roles = data.roles
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      const t = token as ExtendedToken
      ;(session as unknown as { accessToken?: string }).accessToken = t.accessToken
      ;(session as unknown as { roles?: string[] }).roles = Array.isArray(t.roles) ? t.roles : undefined
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
