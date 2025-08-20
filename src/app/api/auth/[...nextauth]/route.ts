import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null
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
        const data = await resp.json().catch(() => null)
        if (!data?.access_token) return null
        return {
          id: credentials.email,
          email: credentials.email,
          accessToken: data.access_token,
          roles: data.roles,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).accessToken = (user as any).accessToken
        ;(token as any).roles = (user as any).roles
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).accessToken = (token as any).accessToken
      ;(session as any).roles = (token as any).roles
      return session
    },
  },
})

export { handler as GET, handler as POST }
