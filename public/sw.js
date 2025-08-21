// Service worker queue with IndexedDB and exponential backoff

const DB_NAME = 'nexora-db';
const STORE_NAME = 'queue';
const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1s
const MAX_DELAY = 60000; // 1m
export const VALID_TYPES = new Set([
  'quotes',
  'evidences',
  'approve/confirm',
  'auth/forgot-password',
  'auth/reset-password',
  'cfdi',
]);

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readAll(db) {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateRetry(db, id, retry) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const itemReq = store.get(id);
  const item = await new Promise((resolve, reject) => {
    itemReq.onsuccess = () => resolve(itemReq.result);
    itemReq.onerror = () => reject(itemReq.error);
  });
  if (item) {
    item.retry = retry;
    store.put(item);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function remove(db, id) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function scheduleRetry(type, attempt) {
  const backoff = Math.min(BASE_DELAY * 2 ** (attempt - 1), MAX_DELAY);
  setTimeout(() => {
    self.registration?.sync?.register(`sync-${type}`);
  }, backoff);
}

export async function processQueue(type) {
  const db = await openDB();
  const all = await readAll(db);
  const items = all.filter(item => item.type === type);

  for (const item of items) {
    let attempt = item.retry || 0;
    try {
      const res = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });
      if (!res.ok) throw new Error('Bad response');
      await remove(db, item.id);
    } catch (err) {
      attempt += 1;
      if (attempt < MAX_RETRIES) {
        await updateRetry(db, item.id, attempt);
        scheduleRetry(type, attempt);
      } else {
        await remove(db, item.id);
      }
    }
  }
}

function handleSync(tag) {
  if (tag && tag.startsWith('sync-')) {
    const type = tag.replace('sync-', '');
    if (VALID_TYPES.has(type)) {
      return processQueue(type);
    }
  }
}

self.addEventListener('sync', event => {
  event.waitUntil(handleSync(event.tag));
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.action === 'processQueue' && data.type && VALID_TYPES.has(data.type)) {
    event.waitUntil(processQueue(data.type));
  }
});

self.addEventListener('push', event => {
  try {
    const data = event.data?.json();
    if (data?.type && VALID_TYPES.has(data.type)) {
      event.waitUntil(processQueue(data.type));
    }
  } catch {}
});

