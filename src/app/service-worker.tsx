'use client';

import { useEffect } from 'react';
import { QUEUE_TAGS, processQueue } from '@/lib/db';

export function ServiceWorker() {
  useEffect(() => {
    const onOnline = () => {
      QUEUE_TAGS.forEach(t => processQueue(t));
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { type: 'module' })
        .then(registration => {
          const regWithSync = registration as unknown as {
            sync?: { register: (tag: string) => Promise<void> };
          };
          QUEUE_TAGS.forEach(tag => {
            regWithSync.sync?.register(`sync-${tag}`).catch(() => {});
          });
        })
        .catch(() => {});
    }
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, []);
  return null;
}
