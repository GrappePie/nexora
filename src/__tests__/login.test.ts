import { POST } from '@/app/api/auth/login/route'
import { expect, describe, it, afterEach, vi } from 'vitest'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

describe('login API route', () => {
  it('forwards backend response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 't' }),
    }) as any
    const req = new Request('http://n/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a', password: 'b' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.access_token).toBe('t')
  })

  it('returns 400 for invalid json', async () => {
    const req = new Request('http://n/api/auth/login', {
      method: 'POST',
      body: 'nope',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 502 when backend unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fail')) as any
    const req = new Request('http://n/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a', password: 'b' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toBe('core_unreachable')
  })
})
