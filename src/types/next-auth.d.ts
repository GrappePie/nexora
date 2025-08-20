declare module 'next-auth' {
  interface Session {
    accessToken?: string
    roles?: string[]
  }
  interface User {
    accessToken?: string
    roles?: string[]
  }
  interface JWT {
    accessToken?: string
    roles?: string[]
  }
}
