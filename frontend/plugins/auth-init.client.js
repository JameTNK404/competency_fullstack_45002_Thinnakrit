// ~/plugins/auth-init.client.js
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  auth.hydrateFromStorage()

  // ── ตรวจ token expiry ทุก 30 วินาที ──
  // จำเป็นเพราะ middleware ทำงานแค่ตอน navigate ถ้า user นิ่งอยู่หน้าเดิม token หมดอายุโดยไม่ถูกเตะ
  function isExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
    } catch { return true }
  }

  const timer = setInterval(() => {
    if (auth.token && isExpired(auth.token)) {
      clearInterval(timer)
      auth.logout()
      navigateTo('/login')
    }
  }, 30_000) // ตรวจทุก 30 วินาที
})

