// import { createVuetify } from 'vuetify'
// import * as components from 'vuetify/components'
// import * as directives from 'vuetify/directives'

// export default defineNuxtPlugin((nuxtApp) => {
//   const vuetify = createVuetify({ components, directives })
//   nuxtApp.vueApp.use(vuetify)
// })

// plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { md3 } from 'vuetify/blueprints'

const light = {
  dark: false,
  colors: {
    background: '#f0fdf9',
    surface: '#ffffff',
    primary: '#0d9488',  /* Teal 600 */
    secondary: '#0f766e',
    error: '#ef4444',
    info: '#0284c7',
    success: '#16a34a',
    warning: '#d97706',
  },
}
const dark = {
  dark: true,
  colors: {
    background: '#042f2e',
    surface: '#134e4a',
    primary: '#2dd4bf',
    secondary: '#99f6e4',
    error: '#f87171',
    info: '#38bdf8',
    success: '#4ade80',
    warning: '#fbbf24',
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    blueprint: md3,
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
    theme: {
      defaultTheme: 'light',     // 👈 ชื่อให้ตรงกับที่เราจะสลับ
      themes: { light, dark },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})
