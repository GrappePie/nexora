import { NextRequest, NextResponse } from 'next/server'

function base() {
  return (process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000').replace(/\/$/, '')
}

export async function GET(req: NextRequest, { params }: { params: { uuid: string } }) {
  const file = req.nextUrl.searchParams.get('file') || 'xml'
  try {
    const resp = await fetch(`${base()}/cfdi/${params.uuid}?file=${file}`, { cache: 'no-store' })
    const arrayBuffer = await resp.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      status: resp.status,
      headers: { 'content-type': resp.headers.get('content-type') || 'application/octet-stream' },
    })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'core_unreachable', detail }, { status: 502 })
  }
}
