self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  // You might want to perform initial caching here
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Clean up old caches, etc.
  return self.clients.claim(); // Become the active service worker for all clients
});

self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  // Add your fetch handling logic here (e.g., cache-first, network-first)
});

// This is the crucial part for making updateServiceWorker() effective
self.addEventListener('waiting', (event) => {
  console.log('Service worker waiting to activate.');
  self.skipWaiting(); // Tell the new service worker to take over immediately
});