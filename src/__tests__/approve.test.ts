import { GET as check } from '@/app/api/approve/check/route'
import { POST as confirm } from '@/app/api/approve/confirm/route'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

describe('approve API routes', () => {
  it('check returns 400 when token missing', async () => {
    const req = new NextRequest('http://n/api/approve/check')
    const res = await check(req)
    expect(res.status).toBe(400)
  })

  it('confirm returns 400 for invalid json', async () => {
    const req = new NextRequest('http://n/api/approve/confirm', {
      method: 'POST',
      body: 'nope',
    })
    const res = await confirm(req)
    expect(res.status).toBe(400)
  })

  it('check forwards backend response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, quote_id: '1' }),
    }) as any
    const req = new NextRequest('http://n/api/approve/check?token=abc')
    const res = await check(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('confirm forwards backend response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'approved' }),
    }) as any
    const req = new NextRequest('http://n/api/approve/confirm', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc' }),
    })
    const res = await confirm(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('approved')
  })
})
