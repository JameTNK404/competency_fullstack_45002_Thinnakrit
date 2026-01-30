<!-- layouts/dashboard.vue -->
<template>
  <v-app>
    <!-- Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!smAndDown"
      :temporary="smAndDown"
      app
    >
      <v-list density="compact" nav>
        <template v-for="sec in menu" :key="sec.label">
          <v-list-subheader class="text-uppercase text-caption">{{ sec.label }}</v-list-subheader>

          <template v-for="it in sec.items" :key="it.to || it.href">
            <NuxtLink
              v-if="it.to"
              :to="it.to"
              class="no-underline"
              exact-active-class="bg-primary text-white rounded-lg"
            >
              <v-list-item :title="it.label" :active="route.path.startsWith(it.to)">
                <template #prepend>
                  <v-icon :icon="it.icon || 'mdi-circle-small'" />
                </template>
              </v-list-item>
            </NuxtLink>

            <a v-else :href="it.href" :target="it.target || '_blank'" class="no-underline">
              <v-list-item :title="it.label">
                <template #prepend>
                  <v-icon :icon="it.icon || 'mdi-circle-small'" />
                </template>
              </v-list-item>
            </a>
          </template>

          <v-divider class="my-2" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar app flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" aria-label="Toggle menu" />
      <v-toolbar-title class="font-semibold">Personnel evaluation system</v-toolbar-title>

      <v-spacer />

      <v-btn icon @click="toggleTheme" :aria-label="`Switch to ${themeName === 'dark' ? 'light':'dark'} theme`">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>

      <!-- Profile -->
      <!-- Profile -->
<v-menu>
  <template #activator="{ props }">
    <v-btn v-bind="props" icon>
      <v-avatar size="36">
        <!-- ✅ แสดงรูปจริง ถ้ามี -->
        <v-img
          v-if="auth.user?.avatar_url"
          :src="auth.user.avatar_url"
          alt="User avatar"
          cover
        />
        <!-- 🧩 fallback ถ้าไม่มีรูป -->
        <span
          v-else
          class="font-semibold text-white bg-primary w-full h-full flex items-center justify-center"
        >
          {{ initials }}
        </span>
      </v-avatar>
    </v-btn>
  </template>

  <v-list>
    <v-list-item
      :title="auth.user?.name || 'ไม่ระบุชื่อ'"
      :subtitle="auth.user?.email || '-'"
      prepend-icon="mdi-account"
    />
    <v-divider class="my-2" />
    <NuxtLink to="/me" class="no-underline">
      <v-list-item title="Profile" prepend-icon="mdi-account-cog-outline" />
    </NuxtLink>
    <v-list-item title="Logout" prepend-icon="mdi-logout" @click="logout" />
  </v-list>
</v-menu>

    </v-app-bar>

    <!-- Content -->
    <v-main class="bg-gray-50">
      <div class="p-4 lg:p-6">
        <slot />
      </div>
    </v-main>

    <v-footer app class="text-caption justify-center">
      © {{ year }} VEC Skills
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '~/stores/auth'
import { useMenu } from '~/composables/useMenu'

const route = useRoute()
const { smAndDown } = useDisplay()
const theme = useTheme()

// Drawer responsive
const drawer = ref(!smAndDown.value)
watch(smAndDown, v => { drawer.value = !v })

// Auth + role
const auth = useAuthStore()
const role = computed(() => auth?.user?.role ?? 'user')

// ✅ ดึงชื่อย่อ (initials) สำหรับ fallback avatar
const initials = computed(() => {
  if (!auth?.user?.name) return '?'
  const parts = auth.user.name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
})


// เมนูตาม role (ส่ง ref/computed เข้าไป)
const { menu } = useMenu(role)

// Theme sync
const themeName = useState('theme', () => 'light')
function applyTheme (name) {
  theme.global.name.value = name
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', name)
    try { localStorage.setItem('theme', name) } catch {}
  }
}
onMounted(() => {
  let saved = null
  try { saved = localStorage.getItem('theme') } catch {}
  themeName.value = saved || themeName.value
  applyTheme(themeName.value)
})
function toggleTheme () {
  themeName.value = themeName.value === 'dark' ? 'light' : 'dark'
  applyTheme(themeName.value)
}

// Footer year
const year = new Date().getFullYear()

// Logout
function logout () {
  try { auth.logout() } catch {}
  navigateTo('/login')
}
</script>

<style scoped>
.no-underline { text-decoration: none; color: inherit; }
.v-avatar span {
  font-size: 0.9rem;
  text-transform: uppercase;
}

</style>
<!-- layouts/dashboard.vue -->