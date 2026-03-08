self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Für das Gruitener Cockpit laden wir immer live,
  // der Service Worker dient hier primär dazu, die App "installable" zu machen.
});
