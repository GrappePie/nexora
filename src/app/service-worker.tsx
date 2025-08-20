'use client';

import { useEffect } from 'react';

export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { type: 'module' })
        .then(registration => {
          ['cotizaciones', 'evidencias'].forEach(tag => {
            registration.sync?.register(`sync-${tag}`).catch(() => {});
          });
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
