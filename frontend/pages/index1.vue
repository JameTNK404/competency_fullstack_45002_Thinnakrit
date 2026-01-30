<!-- pages/dashboard/index.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const stats = ref({ uploads: 0, evaluations: 0, score: 0 })
const loading = ref(true)

onMounted(async () => {
  // โหลดข้อมูลตัวอย่าง
  setTimeout(() => {
    stats.value = { uploads: 12, evaluations: 5, score: 88 }
    loading.value = false
  }, 800)
})
function logout() {
  auth.logout()
  navigateTo('/login')
}
</script>

<template>
  <v-app>
    <!-- NAVBAR -->
    <v-app-bar color="primary" dark>
      <v-app-bar-title>Personnel Evaluation System</v-app-bar-title>
      <v-spacer />
      <v-btn icon><v-icon>mdi-bell-outline</v-icon></v-btn>
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props"><v-icon>mdi-account-circle</v-icon></v-btn>
        </template>
        <v-list>
          <v-list-item title="Profile" prepend-icon="mdi-account" />
          <v-list-item title="Logout" prepend-icon="mdi-logout" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- SIDEBAR + CONTENT -->
    <v-main>
      <v-container class="py-6">
        <!-- Greeting -->
        <h2 class="text-h5 mb-4">สวัสดี {{ auth.user?.name || 'ผู้ใช้' }} 👋</h2>

        <!-- Stats Cards -->
        <v-row v-if="!loading" dense>
          <v-col cols="12" md="4">
            <v-card variant="tonal" color="indigo">
              <v-card-title>ไฟล์หลักฐาน</v-card-title>
              <v-card-text class="text-h5">{{ stats.uploads }}</v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="tonal" color="green">
              <v-card-title>การประเมินทั้งหมด</v-card-title>
              <v-card-text class="text-h5">{{ stats.evaluations }}</v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="tonal" color="deep-orange">
              <v-card-title>คะแนนเฉลี่ย</v-card-title>
              <v-card-text class="text-h5">{{ stats.score }}</v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Loading / Empty -->
        <v-skeleton-loader v-else type="card" class="my-6" />

        <!-- Action Section -->
        <v-card class="mt-8">
          <v-card-title>การดำเนินการ</v-card-title>
          <v-card-text>
            <v-btn color="primary" class="mr-2">เพิ่มหลักฐาน</v-btn>
            <v-btn color="secondary" class="mr-2">ตารางการประเมิน</v-btn>
            <v-btn variant="tonal">ดูคู่มือระบบ</v-btn>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>

    <!-- FOOTER -->
    <v-footer class="text-center" app>
      <v-spacer />
      <span class="text-caption">© 2025 VEC Skills | Powered by KruOak</span>
      <v-spacer />
    </v-footer>
  </v-app>
</template>
