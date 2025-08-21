import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const roles = (req.nextauth.token?.roles as string[]) || []
    if (!roles.includes('admin')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
