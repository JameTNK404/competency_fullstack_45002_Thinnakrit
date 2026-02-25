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
    background: '#f8fafc',
    surface: '#ffffff',
    primary: '#4f46e5',  /* Indigo 600 - modern vibrant blue */
    secondary: '#475569',
    error: '#ef4444',
    info: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
  },
}
const dark = {
  dark: true,
  colors: {
    background: '#0b1220',
    surface: '#111827',
    primary: '#60a5fa',
    secondary: '#94a3b8',
    error: '#f87171',
    info: '#38bdf8',
    success: '#34d399',
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
