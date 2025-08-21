const DB_NAME = 'nexora-db';
const STORE_NAME = 'queue';

export const QUEUE_TAGS = [
  'quotes',
  'evidences',
  'approve/confirm',
  'auth/forgot-password',
  'auth/reset-password',
  'cfdi',
];

export type QueueType = (typeof QUEUE_TAGS)[number];

export interface QueueItem {
  id?: number
  type: QueueType
  payload: unknown
  retry?: number
}

type SyncCapableRegistration = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

function openDB(): Promise<IDBDatabase> {
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

export async function enqueueOperation(type: QueueType, payload: unknown): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({ type, payload, retry: 0 });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = (await navigator.serviceWorker.ready) as SyncCapableRegistration;
    try {
      await registration.sync?.register(`sync-${type}`);
    } catch {
      // ignore
    }
  }
}

export async function getQueue(type: QueueType): Promise<QueueItem[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).getAll();
  const all = await new Promise<QueueItem[]>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
  return all.filter(item => item.type === type);
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function processQueue(type: QueueType): Promise<void> {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ action: 'processQueue', type });
  }
}

