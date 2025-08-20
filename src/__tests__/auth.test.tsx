import { describe, it, expect, vi, afterEach } from 'vitest'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

describe('nextauth auth flow', () => {
  it('refreshes token when expired', async () => {
    const jwtCb = authOptions.callbacks?.jwt as any
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new', exp: 2, roles: ['user'] }),
    }) as any
    const expired = Math.floor(Date.now() / 1000) - 10
    const tok = await jwtCb({ token: { accessToken: 'old', exp: expired, roles: ['user'] } })
    expect(tok.accessToken).toBe('new')
    expect(tok.roles).toEqual(['user'])
  })

  it('persists roles in session', async () => {
    const sessionCb = authOptions.callbacks?.session as any
    const sess = await sessionCb({ session: {}, token: { accessToken: 'x', roles: ['admin'] } })
    expect(sess.roles).toEqual(['admin'])
  })
})
