<script setup>
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

// login
auth.setAuth(token, user)

// ตรวจสอบ login
if (auth.isLogged) {
  console.log('เข้าสู่ระบบแล้ว')
}

// logout
auth.logout()
</script>
