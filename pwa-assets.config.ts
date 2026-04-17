import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generate PWA/install icons from the surreal "cadence" clock,
// but leave favicon.ico alone — it keeps the tomato-clock tab icon.
export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    ...minimal2023Preset,
    transparent: {
      ...minimal2023Preset.transparent,
      favicons: []
    }
  },
  images: ['public/cadence-icon.png']
})
