'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { enqueueOperation } from '@/lib/db'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!navigator.onLine) {
      await enqueueOperation('auth/forgot-password', { email })
    } else {
      try {
        await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email }),
        })
      } catch {
        await enqueueOperation('auth/forgot-password', { email })
      }
    }
    setSent(true)
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <form onSubmit={submit} className="space-y-4">
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" />
        <Button type="submit">Enviar</Button>
        {sent && <p className="text-sm text-green-600">Revisa tu correo</p>}
      </form>
    </div>
  )
}
