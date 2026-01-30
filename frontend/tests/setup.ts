import { vi } from 'vitest'
import { config } from '@vue/test-utils'
// Basic mocks for Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({ public: { apiBase: 'http://localhost:7000' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

// Stub Vuetify components to avoid heavy DOM
config.global.stubs = {
  'v-card': true, 'v-card-title': true, 'v-card-text': true, 'v-card-actions': true,
  'v-btn': true, 'v-alert': true, 'v-text-field': true, 'v-select': true,
  'v-data-table': true, 'v-data-table-server': true, 'v-table': true, 'v-spacer': true
}
