import React from 'react'
import { enqueueOperation } from '@/lib/db'

async function approveCheck(token: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const res = await fetch(`${base}/api/approve/check?token=${encodeURIComponent(token)}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

export function ApproveActions({ token, quoteId }: { token: string; quoteId: string }) {
  'use client'
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState<boolean | null>(null)

  async function onApprove() {
    setBusy(true)
    setMsg(null)
    setOk(null)
    if (!navigator.onLine) {
      await enqueueOperation('approve/confirm', { token })
      setOk(false)
      setMsg('No se pudo contactar al servicio.')
      setBusy(false)
      return
    }
    try {
      const res = await fetch('/api/approve/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res
        .json()
        .catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>
      if (res.ok) {
        setOk(true)
        setMsg('Cotización aprobada correctamente.')
      } else if (res.status === 409) {
        setOk(false)
        setMsg('Transición inválida: la cotización no puede aprobarse en su estado actual.')
      } else if (res.status === 404) {
        setOk(false)
        setMsg('No se encontró la cotización para este token.')
      } else if (res.status === 410) {
        setOk(false)
        setMsg('El token ha expirado. Solicita un nuevo enlace de aprobación.')
      } else if (res.status === 429) {
        setOk(false)
        setMsg('Demasiadas solicitudes. Intenta de nuevo en un minuto.')
      } else if (res.status === 400 && data?.detail === 'token_required') {
        setOk(false)
        setMsg('Token requerido.')
      } else {
        setOk(false)
        setMsg('Error al aprobar. Intenta más tarde.')
      }
    } catch {
      await enqueueOperation('approve/confirm', { token })
      setOk(false)
      setMsg('No se pudo contactar al servicio.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={onApprove}
        disabled={busy}
        className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
      >
        {busy ? 'Aprobando…' : 'Aprobar cotización'}
      </button>
      {msg && (
        <div
          className={
            'rounded p-3 ' + (ok ? 'border border-green-300 bg-green-50 text-green-700' : 'border border-red-300 bg-red-50 text-red-700')
          }
        >
          {msg}
        </div>
      )}
      <p className="text-xs text-gray-500">ID: {quoteId}</p>
    </div>
  )
}

export default async function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await approveCheck(token)
  const ok = result.ok && result.data?.ok
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold mb-4">Aprobación de cotización</h1>
      {!ok ? (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-4">
          Token inválido o expirado.
        </div>
      ) : (
        <div className="rounded border border-green-300 bg-green-50 text-green-700 p-4">
          Token válido. ID de cotización: <strong>{result.data.quote_id}</strong>
          <ApproveActions token={token} quoteId={result.data.quote_id} />
        </div>
      )}
    </main>
  )
}
