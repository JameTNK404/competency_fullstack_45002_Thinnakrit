// middleware/auth.global.ts

/** Decode JWT payload (no verify — just check exp locally) */
function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return true
    const payload = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))
    // exp is in seconds, Date.now() in ms
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true // malformed token → treat as expired
  }
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (process.server) return

  // ── Expiry check: ถ้า token หมดอายุ → logout แล้ว redirect ──
  if (auth.token && isTokenExpired(auth.token)) {
    auth.logout()              // clear store + localStorage
    return navigateTo('/login')
  }

  // Need Auth for these paths
  const authRequiredPaths = ['/', '/users', '/admin', '/evaluator', '/me', '/reports']
  const needAuth = authRequiredPaths.some(p => to.path === p || to.path.startsWith(p + '/'))

  if (needAuth && !auth.token) {
    return navigateTo('/login')
  }

  // Role-based Path Guarantees
  if (auth.token && auth.user) {
    const role = auth.user.role
    const path = to.path

    // Admin Only
    if (path.startsWith('/admin') || path.startsWith('/users')) {
      if (role !== 'admin') return navigateTo('/')
    }

    // Evaluator Only
    if (path.startsWith('/evaluator')) {
      if (role !== 'evaluator' && role !== 'admin') return navigateTo('/')
    }

    // Evaluatee Only
    if (path.startsWith('/me')) {
      if (role !== 'evaluatee' && role !== 'admin') return navigateTo('/')
    }
  }
})

