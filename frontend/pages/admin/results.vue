<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const { $api } = useNuxtApp()
const auth = useAuthStore()

const loading = ref(false)
const errorMsg = ref('')

const periods = ref([])
const activePeriodId = ref(null)

const results = ref([])
const search = ref('')

onMounted(async () => {
  await loadPeriods()
})

async function loadPeriods() {
  try {
     const { data } = await $api.get('/api/periods')
     periods.value = data.data || []
     const active = periods.value.find(p => p.is_active === 1) || periods.value[0]
     if(active) {
         activePeriodId.value = active.id
         await loadResults()
     }
  } catch (e) {
      errorMsg.value = 'Failed to load periods.'
  }
}

async function loadResults() {
  if (!activePeriodId.value) return;
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await $api.get(`/api/reports/admin-results?period_id=${activePeriodId.value}`)
    results.value = data.results || []
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function exportCSV() {
    if(!results.value.length) return;
    
    const headers = ['ชื่อผู้รับการประเมิน', 'แผนก', 'ผู้ประเมิน', 'เปอร์เซ็นต์', 'คะแนน (เต็ม 60)', 'สถานะ'];
    const rows = results.value.map(r => [
        `"${r.evaluatee_name}"`,
        `"${r.department}"`,
        `"${r.evaluator_name}"`,
        r.percentage,
        r.scoreOutOf60,
        `"${r.status}"`
    ]);
    
    // Convert to CSV string with BOM for Excel utf8 compat
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `evaluation_results_period_${activePeriodId.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-h4">รายงานและผลสรุปการประเมิน</h1>
      <v-btn color="primary" prepend-icon="mdi-file-export" @click="exportCSV" :disabled="!results.length">
        Export CSV
      </v-btn>
    </div>

    <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4">{{ errorMsg }}</v-alert>

    <v-card class="mb-4">
        <v-card-text>
            <v-row align="center">
                <v-col cols="12" md="6">
                    <v-select
                        v-model="activePeriodId"
                        :items="periods"
                        item-title="name_th"
                        item-value="id"
                        label="เลือกรอบการประเมิน"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="loadResults"
                    ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        v-model="search"
                        prepend-inner-icon="mdi-magnify"
                        label="ค้นหาชื่อหรือแผนก"
                        variant="outlined"
                        density="compact"
                        hide-details
                    ></v-text-field>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <v-data-table
          :items="results"
          :loading="loading"
          :search="search"
          :headers="[
            { title:'ผู้รับการประเมิน', key:'evaluatee_name' },
            { title:'แผนก', key:'department' },
            { title:'ผู้ประเมิน', key:'evaluator_name' },
            { title:'ความคืบหน้า', key:'status' },
            { title:'คะแนนดิบ (%)', key:'percentage', align: 'end' },
            { title:'คะแนน (เต็ม 60)', key:'scoreOutOf60', align: 'end' }
          ]"
        >
          <template #item.status="{ item }">
              <v-chip :color="item.status === 'Evaluated' ? 'success' : 'warning'" size="small">
                  {{ item.status === 'Evaluated' ? 'ประเมินแล้ว' : 'รอดำเนินการ' }}
              </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>
