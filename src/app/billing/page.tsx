'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { hasRole } from '@/lib/utils'

interface SessionWithExtras { accessToken?: string; roles?: string[] }

export default function BillingPage() {
  const { data } = useSession()
  const session = data as SessionWithExtras | null
  if (!hasRole(session?.roles, 'admin')) {
    return <div>Acceso denegado</div>
  }

  const [customerId, setCustomerId] = useState('')
  const [planId, setPlanId] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState('')

  const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000').replace(/\/$/, '')

  async function fetchStatus() {
    setError('')
    const resp = await fetch(
      `${base}/portal/api/billing/subscription?customer_id=${customerId}&plan_id=${planId}`,
      {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      },
    )
    const data = await resp.json().catch(() => ({}))
    if (resp.ok) {
      setStatus(data.status)
    } else {
      setStatus(null)
      setError(data.detail || 'Error')
    }
  }

  async function handle(action: 'subscribe' | 'cancel') {
    setError('')
    const resp = await fetch(`${base}/portal/api/billing/${action}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify({ customer_id: customerId, plan_id: planId }),
    })
    const data = await resp.json().catch(() => ({}))
    if (resp.ok) {
      // Refrescar desde el backend para asegurar consistencia
      await fetchStatus()
    } else {
      setStatus(null)
      setError(data.detail || 'Error')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Plan ID"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 bg-orange-500 text-white rounded"
          onClick={() => handle('subscribe')}
        >
          Suscribirse
        </button>
        <button
          className="px-3 py-1 bg-gray-300 rounded"
          onClick={() => handle('cancel')}
        >
          Cancelar
        </button>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={fetchStatus}
        >
          Consultar
        </button>
      </div>
      {status && <div className="text-sm">Estado: {status}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}
