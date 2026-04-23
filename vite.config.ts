import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'app-icon.png', 'apple-touch-icon.png'],
      pwaAssets: {
        disabled: false,
        config: true
      },
      manifest: {
        name: 'Cadence',
        short_name: 'Cadence',
        description:
          'Drop-in co-working Pomodoro. Mon–Fri 10am–5pm IST, 50/10 cycles — synced to wall-clock time.',
        theme_color: '#667eea',
        background_color: '#f0e9d6',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,mp3}'],
        globIgnores: ['**/clocks.png']
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
