<!-- pages/auth/login.vue (ตัวอย่างชื่อไฟล์) -->
<script setup>
definePageMeta({ layout: 'auth-vuetify' })

import { ref } from 'vue'

const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// กฎตรวจสอบแบบ JS ธรรมดา
const emailRules = [
  (v) => !!v || 'กรอกอีเมล',
  (v) => /.+@.+\..+/.test(v) || 'รูปแบบไม่ถูกต้อง'
]
const pwRules = [
  (v) => !!v || 'กรอกรหัสผ่าน',
  (v) => String(v).length >= 6 || 'อย่างน้อย 6 ตัว'
]

async function onSubmit () {
  errorMsg.value = ''
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    return navigateTo('/dashboard')
  } catch (e) {
    errorMsg.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card elevation="1">
    <v-card-title class="text-h6">เข้าสู่ระบบ</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="onSubmit">
        <div class="d-flex flex-column ga-3">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            variant="outlined"
            density="comfortable"
            :rules="emailRules"
            autocomplete="username"
          />
          <v-text-field
            v-model="password"
            :type="showPw ? 'text' : 'password'"
            label="Password"
            variant="outlined"
            density="comfortable"
            :rules="pwRules"
            autocomplete="current-password"
            :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPw = !showPw"
          />

          <div class="d-flex align-center justify-space-between">
            <v-checkbox label="Remember me" density="comfortable" hide-details />
            <NuxtLink to="/forgot" class="text-primary text-caption">Forgot password?</NuxtLink>
          </div>

          <v-alert v-if="errorMsg" type="error" variant="tonal" density="comfortable">
            {{ errorMsg }}
          </v-alert>

          <v-btn :loading="loading" block color="primary" type="submit">Sign in</v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>
