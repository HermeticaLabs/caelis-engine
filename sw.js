/**
 * sw.js — Caelis Engine Service Worker v1.5
 * Provee capacidades offline y de instalación PWA.
 * © 2024-2026 Cristian Valeria Bravo / Hermetica Labs
 */

const CACHE_NAME = 'caelis-engine-v1.5.0';

// CDN de Three.js para que Oculus funcione offline
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js',
];

const LOCAL_ASSETS = [
  './',
  './caelis_engine_1_5.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

const ASSETS_TO_CACHE = [...LOCAL_ASSETS, ...CDN_ASSETS];

// 1. Instalación: cachear activos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Caelis SW] Precaching assets v1.5.0');
      // Cachear locales primero (críticos), CDN con fallback silencioso
      return cache.addAll(LOCAL_ASSETS).then(() =>
        Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)))
      );
    })
  );
  self.skipWaiting();
});

// 2. Activación: eliminar cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[Caelis SW] Eliminando caché antigua:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch: Cache-First → Network Fallback
self.addEventListener('fetch', (event) => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cachear respuestas exitosas dinámicamente
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        console.warn('[Caelis SW] Sin red y sin caché:', event.request.url);
      });
    })
  );
});
