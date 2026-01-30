// ~/stores/auth.js
import { defineStore } from 'pinia'
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null
  }),
  getters: {
    isLogged: (s) => !!s.token,
  },
  actions: {
    setAuth(token, user) {
      this.token = token
      this.user  = user
      if (process.client) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user || null))
      }
    },
    hydrateFromStorage() {
      if (!process.client) return
      const t = localStorage.getItem('auth_token')
      const u = localStorage.getItem('auth_user')
      if (t) {
        this.token = t
        try { this.user = u ? JSON.parse(u) : null } catch { this.user = null }
      }
    },
    logout() {
      this.token = null
      this.user  = null
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }
})
