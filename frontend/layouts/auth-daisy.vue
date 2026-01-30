<template>
  <div class="min-h-screen bg-base-200">
    <div class="flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </div>
    <footer class="p-3 text-xs opacity-70 text-center">© {{ year }} VEC Skills</footer>
  </div>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
