<script setup>
import { ref, computed } from 'vue'
import { useMenu } from '~/composables/useMenu'  // มีอยู่แล้วในโปรเจกต์ครู
// TODO: โหลด role จาก store/cookie หลัง login จริง
const role = ref('user') // 'admin' | 'evaluator' | 'user'
const { menu } = useMenu(role)                   // จะคืนเมนูตามบทบาทให้อัตโนมัติ :contentReference[oaicite:5]{index=5}
const drawer = ref(true)
</script>

<template>
  <v-app>
    <v-app-bar color="surface" flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>Personnel evaluation system</v-toolbar-title>
      <v-spacer />
      <NuxtLink to="/theme" class="mr-4">Theme</NuxtLink>
      <!-- โปรไฟล์ -->
      <v-btn icon="mdi-account-circle" variant="text" />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="260">
      <v-list density="comfortable" nav>
        <template v-for="(section, i) in menu" :key="i">
          <v-list-subheader class="text-caption">{{ section.label }}</v-list-subheader>
          <v-list-item
            v-for="(it, j) in section.items"
            :key="j"
            :to="it.to"
            :href="it.href"
            :target="it.target"
            :prepend-icon="it.icon"
            :title="it.label"
            :value="it.to || it.href"
          />
          <v-divider class="my-2" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="py-6">
        <slot />
      </v-container>
      <v-footer app class="text-caption justify-center">© 2025 VEC Skills</v-footer>
    </v-main>
  </v-app>
</template>
