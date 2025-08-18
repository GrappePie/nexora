import { NextResponse } from 'next/server'

export async function GET() {
  const base = process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const url = `${base.replace(/\/$/, '')}/health`
  try {
    const resp = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } })
    const data = await resp.json()
    return NextResponse.json({ core: data }, { status: resp.ok ? 200 : resp.status })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'core_unreachable', detail }, { status: 502 })
  }
}
