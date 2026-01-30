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
        { label: 'Dashboard', to: '/',              icon: 'mdi-view-dashboard-outline' },
        { label: 'Upload',    to: '/upload',        icon: 'mdi-tray-arrow-up' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { label: 'Users',         to: '/users',            icon: 'mdi-account-cog-outline' },
        { label: 'Periods',       to: '/admin/periods',    icon: 'mdi-calendar-range' },
        { label: 'Topics',        to: '/admin/topics',     icon: 'mdi-format-list-bulleted' },
        { label: 'Assignments',   to: '/admin/assignments',icon: 'mdi-account-multiple-check' },
        { label: 'Monitor',       to: '/admin/monitor',    icon: 'mdi-progress-check' },
        { label: 'Reports',       to: '/reports',          icon: 'mdi-chart-areaspline' },
        { label: 'Settings',      to: '/settings',         icon: 'mdi-cog-outline' },
        { label: 'API Docs', href: 'http://localhost:7000/docs', target: '_blank', icon: 'mdi-book-open-outline' },
      ]
    }
  ],

  evaluator: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/',       icon: 'mdi-view-dashboard-outline' },
        { label: 'Upload',    to: '/upload', icon: 'mdi-tray-arrow-up' },
      ]
    },
    {
      label: 'EVALUATION',
      items: [
        { label: 'Assigned Tasks',  to: '/eval/tasks',   icon: 'mdi-clipboard-check-outline' },
        { label: 'Scoring',         to: '/eval/scoring', icon: 'mdi-lead-pencil' },
        { label: 'Results',         to: '/eval/results', icon: 'mdi-file-check-outline' },
        { label: 'Users',           to: '/users',        icon: 'mdi-account-multiple-outline' },
        { label: 'API Docs', href: 'http://localhost:7000/docs', target: '_blank', icon: 'mdi-book-open-outline' },
      ]
    }
  ],

  user: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/',           icon: 'mdi-view-dashboard-outline' },
        { label: 'Upload',    to: '/upload',     icon: 'mdi-tray-arrow-up' }, // ✅ บังคับมีแน่
      ]
    },
    {
      label: 'MY EVALUATION',
      items: [
        { label: 'Profile',         to: '/me',             icon: 'mdi-account' },
        { label: 'Indicators',      to: '/me/indicators',  icon: 'mdi-format-list-bulleted-square' },
        { label: 'Self Assessment', to: '/me/self-score',  icon: 'mdi-star-check-outline' },
        { label: 'Progress',        to: '/me/progress',    icon: 'mdi-progress-clock' },
        { label: 'Export',          to: '/me/export',      icon: 'mdi-tray-arrow-down' },
        { label: 'Feedback',        to: '/me/feedback',    icon: 'mdi-message-draw' },
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
