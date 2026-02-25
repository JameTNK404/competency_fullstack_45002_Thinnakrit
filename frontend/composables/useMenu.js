// ~/composables/useMenu.js
import { ref, isRef, computed } from 'vue'

// ถ้า backend ส่ง 'evaluatee' ให้ map มาเป็น 'user'
function normalizeRole(r) {
  const x = (r || '').toString().toLowerCase()
  if (x === 'evaluatee') return 'user'
  return ['admin', 'evaluator', 'user'].includes(x) ? x : 'user'
}

const MAP = {
  admin: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { label: 'Users', to: '/admin/users', icon: 'mdi-account-cog-outline' },
        { label: 'Periods', to: '/admin/periods', icon: 'mdi-calendar-range' },
        { label: 'Topics', to: '/admin/topics', icon: 'mdi-format-list-bulleted' },
        { label: 'Indicators', to: '/admin/indicators', icon: 'mdi-format-list-bulleted-square' },
        { label: 'Assignments', to: '/admin/assignments', icon: 'mdi-account-multiple-check' },
        { label: 'Results', to: '/admin/results', icon: 'mdi-file-chart-outline' },
      ]
    },
    {
      label: 'REPORTS',
      items: [
        { label: 'Normalized /60', to: '/reports/normalized', icon: 'mdi-chart-bar' },
        { label: 'Progress', to: '/reports/progress', icon: 'mdi-chart-donut' },
        { label: 'API Docs', href: 'http://localhost:7001/docs', target: '_blank', icon: 'mdi-book-open-outline' },
      ]
    }
  ],

  evaluator: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
      ]
    },
    {
      label: 'EVALUATION',
      items: [
        { label: 'My Assignments', to: '/evaluator/assignments', icon: 'mdi-clipboard-check-outline' },
        { label: 'History', to: '/evaluator/history', icon: 'mdi-history' },
        { label: 'Normalized /60', to: '/reports/normalized', icon: 'mdi-chart-bar' },
      ]
    }
  ],

  user: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
      ]
    },
    {
      label: 'MY EVALUATION',
      items: [
        { label: 'My Evaluation', to: '/me', icon: 'mdi-clipboard-account-outline' },
        { label: 'Upload Evidence', to: '/me/evidence', icon: 'mdi-upload' },
        { label: 'My Report', to: '/me/report', icon: 'mdi-file-chart-outline' },
      ]
    }
  ]
}

export function useMenu(roleInput = 'user') {
  const r = isRef(roleInput) ? roleInput : ref(roleInput)

  // ให้เมนูปลอดภัยแม้ role ยังไม่พร้อม (ตอน hydrate แรก ๆ)
  const menu = computed(() => {
    const key = normalizeRole(r.value)
    return MAP[key] || MAP.user
  })

  return { menu }
}
