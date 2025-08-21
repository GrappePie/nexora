import { NextRequest, NextResponse } from 'next/server'

function base() {
  return (process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000').replace(/\/$/, '')
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams
  const otId = search.get('otId')
  if (!otId) {
    return NextResponse.json({ error: 'missing_otId' }, { status: 400 })
  }
  try {
    const resp = await fetch(`${base()}/evidences?otId=${encodeURIComponent(otId)}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    const data = await resp.json().catch(() => ([]))
    return NextResponse.json(data, { status: resp.status })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'core_unreachable', detail }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  try {
    const resp = await fetch(`${base()}/evidences`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await resp.json().catch(() => ({}))
    return NextResponse.json(data, { status: resp.status })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'core_unreachable', detail }, { status: 502 })
  }
}
