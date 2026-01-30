<!-- layouts/daisy.vue -->
<template>
  <div class="min-h-screen bg-base-200" :data-theme="themeName">
    <div class="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" class="drawer-toggle" />

      <!-- MAIN -->
      <div class="drawer-content flex min-h-dvh flex-col">
        <!-- Top bar -->
        <div class="navbar bg-base-100 border-b">
          <div class="flex-none lg:hidden">
            <label for="drawer" class="btn btn-ghost btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div class="flex-1 px-2 font-semibold">Personnel evaluation system</div>
          <div class="flex-none">
            <button class="btn btn-ghost" @click="toggleTheme">Theme</button>
          </div>
        </div>

        <main class="p-4 lg:p-6">
          <slot />
        </main>

        <footer class="p-3 text-xs opacity-70">© {{ year }} VEC Skills</footer>
      </div>

      <!-- SIDEBAR -->
      <div class="drawer-side">
        <label for="drawer" class="drawer-overlay"></label>
        <aside class="w-72 bg-base-100">
          <div class="p-4 text-sm font-medium opacity-70">Overview</div>
          <ul class="menu">
            <li><NuxtLink to="/dashboard">Dashboard</NuxtLink></li>
          </ul>

          <div class="p-4 text-sm font-medium opacity-70">My Evaluation</div>
          <ul class="menu">
            <li><NuxtLink to="/me">My Profile</NuxtLink></li>
            <li><NuxtLink to="/me/indicators">Indicators</NuxtLink></li>
            <li><NuxtLink to="/me/self-score">Self-Score</NuxtLink></li>
            <li><NuxtLink to="/me/evidence">Evidence Upload</NuxtLink></li>
            <li><NuxtLink to="/me/progress">Progress</NuxtLink></li>
            <li><NuxtLink to="/me/export">Export</NuxtLink></li>
            <li><NuxtLink to="/me/feedback">Feedback</NuxtLink></li>
          </ul>
        </aside>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useState } from '#app' // Nuxt composable

export default defineComponent({
  name: 'DaisyLayout',
  setup() {
    const year = new Date().getFullYear()
    const themeName = useState('daisy-theme', () => 'light')

    const applyTheme = () => {
      if (process.client) {
        document.documentElement.setAttribute('data-theme', themeName.value)
      }
    }

    const toggleTheme = () => {
      themeName.value = themeName.value === 'dark' ? 'light' : 'dark'
      applyTheme()
    }

    onMounted(() => {
      applyTheme()
    })

    return {
      year,
      themeName,
      toggleTheme,
    }
  },
})
</script>
