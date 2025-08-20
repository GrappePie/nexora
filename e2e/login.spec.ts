import { test, expect } from '@playwright/test'
import { spawn } from 'child_process'

let server: any

test.beforeAll(async () => {
  server = spawn('python', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8000'])
  await new Promise((r) => setTimeout(r, 2000))
})

test.afterAll(() => {
  server.kill()
})

test('login succeeds', async ({ request }) => {
  const resp = await request.post('http://127.0.0.1:8000/auth/login', {
    data: { email: 'admin@example.com', password: 'admin' },
  })
  expect(resp.status()).toBe(200)
  const data = await resp.json()
  expect(data.access_token).toBeTruthy()
})

test('login fails with wrong password', async ({ request }) => {
  const resp = await request.post('http://127.0.0.1:8000/auth/login', {
    data: { email: 'admin@example.com', password: 'wrong' },
  })
  expect(resp.status()).toBe(401)
})

test('quote approval flow', async ({ request }) => {
  const qResp = await request.post('http://127.0.0.1:8000/quotes/', {
    data: { customer: 'PW', total: 1 },
  })
  const q = await qResp.json()
  const check = await request.post('http://127.0.0.1:8000/quotes/approve-check', {
    data: { token: q.token },
  })
  expect(check.status()).toBe(200)
  const confirm = await request.post('http://127.0.0.1:8000/quotes/approve-confirm', {
    data: { token: q.token },
  })
  expect(confirm.status()).toBe(200)
})
