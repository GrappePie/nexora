import 'fake-indexeddb/auto';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { enqueueOperation, getQueue, clearQueue } from '@/lib/db';
import { processQueue } from '../../public/sw.js';

describe('background sync queue', () => {
  beforeEach(async () => {
    await clearQueue();
    // stub service worker registration for retries
    (globalThis as any).self = {
      registration: { sync: { register: vi.fn(() => Promise.resolve()) } }
    };
  });

  it('persists operations when offline', async () => {
    await enqueueOperation('cotizaciones', { id: 1 });
    const items = await getQueue('cotizaciones');
    expect(items).toHaveLength(1);
    expect(items[0].payload).toEqual({ id: 1 });
  });

  it('resends and clears queue on success', async () => {
    await enqueueOperation('cotizaciones', { id: 2 });
    global.fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    await processQueue('cotizaciones');
    const items = await getQueue('cotizaciones');
    expect(items).toHaveLength(0);
  });

  it('retries failed operations', async () => {
    await enqueueOperation('cotizaciones', { id: 3 });
    let attempt = 0;
    global.fetch = vi.fn(() => {
      attempt += 1;
      if (attempt === 1) return Promise.reject(new Error('offline'));
      return Promise.resolve(new Response(null, { status: 200 }));
    });

    await processQueue('cotizaciones');
    let items = await getQueue('cotizaciones');
    expect(items[0].retry).toBe(1);

    await processQueue('cotizaciones');
    items = await getQueue('cotizaciones');
    expect(items).toHaveLength(0);
  });
});

