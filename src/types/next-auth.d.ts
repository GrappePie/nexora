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

declare module 'next-auth/providers/credentials' {
  const Credentials: (options?: any) => any
  export default Credentials
}

declare module 'next-auth/middleware' {
  const middleware: any
  export default middleware
}
