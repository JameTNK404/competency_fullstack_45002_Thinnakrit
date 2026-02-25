// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (process.server) return

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
      if (role !== 'admin') {
        return navigateTo('/') // fallback to dashboard showing forbidden or normal view
      }
    }

    // Evaluator Only
    if (path.startsWith('/evaluator')) {
      if (role !== 'evaluator' && role !== 'admin') {
        return navigateTo('/')
      }
    }

    // Evaluatee Only
    if (path.startsWith('/me')) {
      if (role !== 'evaluatee' && role !== 'admin') {
        return navigateTo('/')
      }
    }
  }
})
