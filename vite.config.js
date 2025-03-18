import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Change from 'autoUpdate' to 'prompt'
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
        globPatterns: ['**/*.{js,css,html,png,jpg,svg}'],
        skipWaiting: false, // This setting is good
        clientsClaim: false, // This setting is good
        runtimeCaching: [
          {
            urlPattern: /\/versionNotes\.json/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'version-notes',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          }
        ]
      },
    }),
  ],
});