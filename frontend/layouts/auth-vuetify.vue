<template>
  <v-app>
    <v-main>
      <!-- Centered container -->
      <div class="d-flex align-center justify-center" style="min-height: 100vh; background: rgb(var(--v-theme-background));">
        <div class="w-100" style="max-width: 420px;">
          <slot />
        </div>
      </div>
    </v-main>
    <v-footer class="text-caption text-medium-emphasis px-6">© {{ year }} VEC Skills 2568</v-footer>
  </v-app>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
