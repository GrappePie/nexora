'use client';

import { useEffect } from 'react';

export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { type: 'module' })
        .then(registration => {
          const regWithSync = registration as unknown as {
            sync?: { register: (tag: string) => Promise<void> };
          };
          const tags = [
            'quotes',
            'evidences',
            'approve/confirm',
            'auth/forgot-password',
            'auth/reset-password',
            'cfdi',
          ];
          tags.forEach(tag => {
            regWithSync.sync?.register(`sync-${tag}`).catch(() => {});
          });
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
