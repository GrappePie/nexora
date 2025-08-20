import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'

type AppUser = { id: string; email: string; accessToken: string; roles?: string[] }
interface LoginResponse { access_token: string; roles?: string[] }
type ExtendedToken = JWT & { accessToken?: string; roles?: string[] }

enum AuthProviderName { Credentials = 'Credentials' }

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: AuthProviderName.Credentials,
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const base =
          process.env.BACKEND_API_BASE ||
          process.env.NEXT_PUBLIC_API_BASE ||
          'http://localhost:8000'
        const url = `${base.replace(/\/$/, '')}/auth/login`
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
          roles: data.roles,
        }
        return user
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AppUser
        const t = token as unknown as ExtendedToken
        t.accessToken = u.accessToken
        t.roles = u.roles
      }
      return token
    },
    async session({ session, token }) {
      const t = token as unknown as ExtendedToken
      ;(session as unknown as { accessToken?: string; roles?: string[] }).accessToken = t.accessToken
      ;(session as unknown as { accessToken?: string; roles?: string[] }).roles = Array.isArray(t.roles) ? t.roles : undefined
      return session
    },
  },
})

export { handler as GET, handler as POST }
