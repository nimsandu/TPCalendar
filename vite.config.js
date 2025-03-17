import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'The Poets Calendar',
        short_name: 'TPCalendar',
        description: 'tp calendar beta preview v0.1',
        theme_color: '#000000',
        icons: [
          {
            src: '/pwa-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        importScripts: ['sw.js'], // Reference our custom SW
        // Remove runtimeCaching from here since we handle it in sw.js
      },
      strategies: 'injectManifest', // Use injectManifest strategy
      injectManifest: {
        injectionPoint: undefined,
      }
    }),
  ],
});