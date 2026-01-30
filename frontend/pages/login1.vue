<template>
  <v-app>
    <v-main>
      <v-container class="d-flex align-center justify-center" style="min-height: 100vh">
        <v-card max-width="420" class="w-100">
          <v-card-title class="text-h6">เข้าสู่ระบบ</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="onSubmit" v-model="valid">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="[r => !!r || 'กรอกอีเมล', r => /.+@.+\..+/.test(r) || 'อีเมลไม่ถูกต้อง']"
                prepend-inner-icon="mdi-email-outline"
                required
              />
              <v-text-field
                v-model="password"
                label="Password"
                :type="show ? 'text' : 'password'"
                :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="show = !show"
                prepend-inner-icon="mdi-lock-outline"
                :rules="[r => !!r || 'กรอกรหัสผ่าน']"
                required
              />
              <div class="d-flex justify-space-between align-center">
                <v-checkbox v-model="remember" label="Remember me" density="compact" />
                <NuxtLink to="/forgot">Forgot password?</NuxtLink>
              </div>
              <v-btn :loading="loading" :disabled="!valid || loading" type="submit" color="primary" block class="mt-2">
                SIGN IN
              </v-btn>
              <v-alert v-if="error" type="error" variant="tonal" class="mt-3">{{ error }}</v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
definePageMeta({ layout: 'auth-login', ssr: false })
import { ref } from 'vue'
const email = ref('')
const password = ref('')
const remember = ref(false)
const show = ref(false)
const loading = ref(false)
const error = ref('')
const valid = ref(false)

const config = useRuntimeConfig()
const router = useRouter()

async function onSubmit() {
  try {
    loading.value = true
    error.value = ''
    // เรียก API login → ได้ JWT กลับ (ตามที่ครูทำไว้ที่ backend)
    const res = await $fetch(`${config.public.apiBase}/api/auth/login`, {
      method: 'POST',
      body: { email: email.value, password: password.value, remember: remember.value }
    })
    // สมมุติ backend ส่ง { accessToken, user:{ id, role, name_th ... } }
    // เก็บ token อย่างปลอดภัย (เช่น httpOnly cookie ฝั่ง server; ถ้าเก็บฝั่ง client ใช้ pinia + refresh flow)
    // จากนั้น redirect ตาม role
    const role = (res?.user?.role || 'user').toLowerCase()
    router.push('/') // เข้าหน้า Dashboard (เมนูจะเรนเดอร์ตาม role)
  } catch (e) {
    error.value = (e?.data?.message) || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
