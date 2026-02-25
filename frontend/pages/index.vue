<script setup>
definePageMeta({ layout: 'dashboard' })
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()
const role = auth.user?.role || ''

// Dashboard stats placeholders (would be fetched from an API in a real scenario)
// For now we just mock them to show layout intent
const adminStats = { users: 0, periods: 0, topics: 0 }
const evaluatorStats = { pending: 0, completed: 0 }
const evaluateeStats = { uploaded: 0, required: 0 }

const name = auth.user?.name_th || auth.user?.email || 'User'
</script>

<template>
  <div class="px-4 py-6">
    <h1 class="text-h4 mb-4">ยินดีต้อนรับ, {{ name }}</h1>
    <h2 class="text-subtitle-1 text-grey-darken-1 mb-6">ระบบการประเมินบุคลากร (Teacher Evaluation System)</h2>
    
    <v-alert v-if="!role" type="warning" variant="tonal" class="mb-4">
      ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน
    </v-alert>

    <!-- ADMIN DASHBOARD -->
    <div v-if="role === 'admin'">
      <v-row>
        <v-col cols="12" sm="4">
          <v-card color="primary" variant="tonal">
            <v-card-title>จัดการผู้ใช้</v-card-title>
            <v-card-text class="text-h4">{{ adminStats.users }}</v-card-text>
            <v-card-actions>
              <NuxtLink to="/users">
                <v-btn variant="text">ดูทั้งหมด</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card color="success" variant="tonal">
            <v-card-title>รอบการประเมิน</v-card-title>
            <v-card-text class="text-h4">{{ adminStats.periods }}</v-card-text>
            <v-card-actions>
              <NuxtLink to="/admin/periods">
                <v-btn variant="text">จัดการรอบ</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card color="info" variant="tonal">
            <v-card-title>หัวข้อประเมิน</v-card-title>
            <v-card-text class="text-h4">{{ adminStats.topics }}</v-card-text>
            <v-card-actions>
              <NuxtLink to="/admin/topics">
                <v-btn variant="text">จัดการหัวข้อ/ตัวชี้วัด</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- EVALUATOR DASHBOARD -->
    <div v-else-if="role === 'evaluator'">
      <v-row>
        <v-col cols="12" sm="6">
          <v-card color="warning" variant="tonal">
            <v-card-title>งานประเมินที่รอดำเนินการ</v-card-title>
            <v-card-text class="text-h4">{{ evaluatorStats.pending }} รายการ</v-card-text>
            <v-card-actions>
              <NuxtLink to="/evaluator/assignments">
                <v-btn variant="text">ไปที่งานของฉัน</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card color="success" variant="tonal">
            <v-card-title>ประเมินสำเร็จแล้ว</v-card-title>
            <v-card-text class="text-h4">{{ evaluatorStats.completed }} รายการ</v-card-text>
            <v-card-actions>
              <NuxtLink to="/evaluator/history">
                <v-btn variant="text">ดูประวัติ</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- EVALUATEE DASHBOARD -->
    <div v-else-if="role === 'evaluatee'">
      <v-row>
        <v-col cols="12" sm="6">
          <v-card color="info" variant="tonal">
            <v-card-title>สถานะการอัปโหลดหลักฐาน</v-card-title>
            <v-card-text class="text-h4">รอการประเมิน</v-card-text>
            <v-card-actions>
              <NuxtLink to="/me/evidence">
                <v-btn variant="text">จัดการหลักฐาน</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card color="primary" variant="tonal">
            <v-card-title>รายงานผลส่วนบุคคล</v-card-title>
            <v-card-text>คลิกเพื่อดูสรุปคะแนนของคุณ</v-card-text>
            <v-card-actions>
              <NuxtLink to="/me/evaluation">
                <v-btn variant="text">ดูผลประเมิน</v-btn>
              </NuxtLink>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

  </div>
</template>

<style scoped>
</style>
