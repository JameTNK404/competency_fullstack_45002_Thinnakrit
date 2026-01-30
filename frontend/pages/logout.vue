<script setup>
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()

function logout() {
  auth.logout()
}
</script>

<template>
  <header class="navbar bg-base-200">
    <div class="flex-1">VEC Skills System</div>
    <div v-if="auth.isLogged" class="flex-none">
      <span class="mr-2">{{ auth.user?.name }}</span>
      <button class="btn btn-error btn-sm" @click="logout">Logout</button>
    </div>
  </header>
</template>
