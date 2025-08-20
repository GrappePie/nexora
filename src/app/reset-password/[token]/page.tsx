'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { enqueueOperation } from '@/lib/db'

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()

  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
    } catch {
      await enqueueOperation('auth/reset-password', { token, password })
    }
    setDone(true)
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <form onSubmit={submit} className="space-y-4">
        <Input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="Nueva contraseña"
        />
        <Button type="submit">Restablecer</Button>
        {done && <p className="text-sm text-green-600">Contraseña actualizada</p>}
      </form>
    </div>
  )
}
