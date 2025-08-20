## Manifest (recordatorio)

- `name`, `short_name`, `start_url`, `display: standalone`.
- `background_color: #111827`, `theme_color: #F97316`.
- Íconos: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `icon-512-mono.png` (Android 13+ themed).

## iOS (meta tags)

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<!-- splash por tamaños en /public/splash, ver etiquetas en README -->
```

## Android

- Usa manifest + service worker. **No** requiere splash por tamaño.

## Background Sync & IndexedDB

- Las operaciones offline se guardan en IndexedDB (`src/lib/db.ts`).
- El service worker (`public/sw.js`) registra `background sync` (`sync-operations`) y reintenta cuando vuelve la conexión.
- Al completarse, la outbox se limpia automáticamente.

## Botón "Instalar"

```ts
let deferredPrompt:any
window.addEventListener('beforeinstallprompt', (e:any)=>{ e.preventDefault(); deferredPrompt=e })
async function install(){ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null }
```
