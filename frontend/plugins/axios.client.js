// plugins/axios.client.js
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const api = axios.create({
    baseURL: config.public.apiBase || 'http://localhost:7000',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false
  })

  // ✅ แนบ token ทุกครั้งที่ request
  api.interceptors.request.use((req) => {
    // รองรับทั้ง store และ localStorage
    const token =
      auth.token ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken')

    if (token) {
      req.headers = req.headers || {}
      req.headers.Authorization = `Bearer ${token}`
      console.log('[Axios] ส่ง token:', token.slice(0, 15) + '...')
    } else {
      console.warn('[Axios] ไม่มี token จะส่ง')
    }

    return req
  })

  // ✅ เพิ่ม debug ถ้า server บอก Missing token
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        console.warn('[Axios] 401 Unauthorized:', err?.response?.data)
      }
      return Promise.reject(err)
    }
  )

  nuxtApp.provide('api', api)
})
