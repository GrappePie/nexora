import { test, expect } from '@playwright/test'
import { spawn } from 'child_process'

let server: any

test.beforeAll(async () => {
  server = spawn('python', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    env: {
      ...process.env,
      BILLING_PROVIDER: 'stripe',
      STRIPE_API_KEY: 'sk_test',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      PYTHONPATH: 'backend/tests/stubs',
    },
  })
  await new Promise((r) => setTimeout(r, 2000))
})

test.afterAll(() => {
  server.kill()
})

test('subscription flow with webhook', async ({ request }) => {
  const loginResp = await request.post('http://127.0.0.1:8000/auth/login', {
    data: { email: 'admin@example.com', password: 'admin' },
  })
  expect(loginResp.status()).toBe(200)
  const token = (await loginResp.json()).access_token
  expect(token).toBeTruthy()

  const subResp = await request.post('http://127.0.0.1:8000/portal/api/billing/subscribe', {
    data: { customer_id: 'cus_pw', plan_id: 'plan_basic' },
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(subResp.status()).toBe(200)

  const webhookPayload = {
    type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_123' } },
  }
  const webhookResp = await request.post('http://127.0.0.1:8000/portal/api/billing/webhook', {
    data: webhookPayload,
    headers: { 'stripe-signature': 't' },
  })
  expect(webhookResp.status()).toBe(200)
})
