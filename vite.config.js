import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Keep as 'prompt' to avoid auto-update
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
          {
            src: '/pwa-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        display: 'standalone',
        background_color: '#ffffff',
        start_url: '/',
        orientation: 'portrait',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg}'],
        skipWaiting: false, // We'll handle this manually
        clientsClaim: true, // This helps with faster activation
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/versionNotes\.json/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'version-notes',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 3600, // 1 hour for faster updates
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ]
      },
      devOptions: {
        enabled: true
      }
    }),
  ],
});