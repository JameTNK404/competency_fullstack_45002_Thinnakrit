<!-- pages/auth/login.vue -->
<script setup>
definePageMeta({ layout: 'auth-daisy' })

import { ref } from 'vue'

const email = ref('')
const password = ref('')
const showPw = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit () {
  errorMsg.value = ''
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api('/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        remember: rememberMe.value
      }
    })
    navigateTo('/dashboard')
  } catch (e) {
    errorMsg.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h2 class="card-title">เข้าสู่ระบบ</h2>

      <form class="form-control gap-3" @submit.prevent="onSubmit">
        <!-- Email -->
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Email</span></div>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            placeholder="you@example.com"
            class="input input-bordered w-full"
            required
          />
        </label>

        <!-- Password + Show/Hide -->
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Password</span></div>
          <div class="join w-full">
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              autocomplete="current-password"
              class="input input-bordered join-item w-full"
              required
            />
            <button
              type="button"
              class="btn join-item"
              @click="showPw = !showPw"
              :aria-pressed="showPw"
            >
              {{ showPw ? 'Hide' : 'Show' }}
            </button>
          </div>
        </label>

        <!-- Remember me + Forgot -->
        <div class="flex items-center justify-between">
          <label class="label cursor-pointer gap-2">
            <input v-model="rememberMe" type="checkbox" class="checkbox checkbox-sm" />
            <span class="label-text">Remember me</span>
          </label>
          <NuxtLink to="/forgot" class="link link-primary text-sm">Forgot password?</NuxtLink>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="alert alert-error">
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Submit -->
        <button :disabled="loading" class="btn btn-primary mt-1" type="submit">
          <span v-if="!loading">Sign in</span>
          <span v-else class="loading loading-spinner" aria-label="Loading"></span>
        </button>
      </form>
    </div>
  </div>
</template>
