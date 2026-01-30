// ~/plugins/auth-init.client.js
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  auth.hydrateFromStorage()
})
