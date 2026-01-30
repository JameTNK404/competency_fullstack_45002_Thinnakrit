// // https://nuxt.com/docs/api/configuration/nuxt-config
// import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// export default defineNuxtConfig({
//   modules: ['@pinia/nuxt'],
//   devtools: { enabled: false },
//   runtimeConfig: {
//     public: {
//       // apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:7000'
//        apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:7000'
//     }
//   },
//   css: [
//     'vuetify/styles',
//     '~/assets/css/tailwind.css'
//   ],
//   build: {
//     transpile: ['vuetify']
//   },
//   vite: {
//     ssr: {
//       noExternal: ['vuetify']
//     },
//     plugins: [
//       vuetify({ autoImport: true })
//     ],
//     vue: {
//       template: {
//         transformAssetUrls
//       }
//     }
//   }
// })

// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
   // ✅ ตั้งค่า compatibilityDate ตามที่ Nuxt เตือน
 nitro: {
    compatibilityDate: '2025-10-12', // 🔥 วันที่ตามที่ Nuxt แนะนำใน warning
  },

  modules: ['@pinia/nuxt'],
   pinia: {
    autoImports: ['defineStore', 'storeToRefs']
  },
  devtools: { enabled: false },
 runtimeConfig: {
    public: {
      // apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:7000'
       apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:7000'
    }
  },
  // ✅ ย้าย PostCSS มาตั้งค่าที่นี่
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css', 
    '~/assets/css/tailwind.css'
  ],

  build: { transpile: ['vuetify'] },
  vite: {
    ssr: { noExternal: ['vuetify'] },
    plugins: [vuetify({ autoImport: true })],
    vue: { template: { transformAssetUrls } }
  }
})
