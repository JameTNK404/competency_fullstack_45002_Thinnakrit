<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const { $api } = useNuxtApp()
const auth = useAuthStore()

const loading = ref(false)
const errorMsg = ref('')

const period = ref(null)
const assignments = ref([])

onMounted(async () => {
  await loadAssignments()
})

async function loadAssignments() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await $api.get('/api/evaluator/assignments')
    period.value = data.period
    assignments.value = data.assignments || []
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function viewEvaluatee(evaluateeId) {
    router.push(`/evaluator/evaluatee/${evaluateeId}`)
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-4">
      <h1 class="text-h4">รายชื่อผู้รับการประเมิน</h1>
      <p class="text-subtitle-1 text-grey-darken-1" v-if="period">
        รอบการประเมินรหัส: {{ period.code }} ({{ period.name_th }})
      </p>
    </div>

    <v-card>
      <v-card-text>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-3">{{ errorMsg }}</v-alert>

        <v-data-table
          :items="assignments"
          :loading="loading"
          :headers="[
            { title:'ชื่อผู้รับการประเมิน', key:'evaluatee_name' },
            { title:'แผนก', key:'department' },
            { title:'ตัวชี้วัดที่ให้คะแนนแล้ว', key:'scored_count' },
            { title:'จัดการ', key:'actions', sortable:false, align:'end' }
          ]"
        >
          <template #item.actions="{ item }">
            <v-btn size="small" color="primary" variant="elevated" @click="viewEvaluatee(item.evaluatee_id)">
              ดูหลักฐาน / ให้คะแนน
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>
