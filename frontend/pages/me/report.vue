<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const { $api } = useNuxtApp()
const auth = useAuthStore()

const loading = ref(false)
const errorMsg = ref('')

const period = ref(null)
const evaluatee = ref(null)
const report = ref(null)

onMounted(async () => {
    await loadMyReport()
})

async function loadMyReport() {
    loading.value = true
    errorMsg.value = ''
    try {
        // Fetch active period details
        const resPeriod = await $api.get('/api/periods/active')
        if(!resPeriod.data.data) {
             errorMsg.value = "No active period found."
             return;
        }
        period.value = resPeriod.data.data

        const { data } = await $api.get(`/api/reports/normalized/${auth.user.id}?period_id=${period.value.id}`)
        evaluatee.value = data.evaluatee
        report.value = data.scoreData
    } catch (e) {
        errorMsg.value = e.response?.data?.message || 'คุณยังไม่ได้รับการจัดสรรหรือยังไม่มีการประเมินในรอบนี้'
    } finally {
        loading.value = false
    }
}

function printReport() {
    window.print()
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="d-print-none mb-4 flex items-center justify-between">
        <h1 class="text-h4">รายงานผลการประเมินรายบุคคล</h1>
        <v-btn color="primary" prepend-icon="mdi-printer" @click="printReport" :disabled="!report">
            พิมพ์ / บันทึก PDF
        </v-btn>
    </div>

    <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4 d-print-none">{{ errorMsg }}</v-alert>

    <div v-if="loading" class="text-center py-10 d-print-none">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-if="!loading && report" class="report-container">
        <!-- Print Header -->
        <div class="text-center mb-6">
            <h2 class="text-h5 font-weight-bold">รายงานผลการปฏิบัติงานของครูและบุคลากร</h2>
            <div class="text-subtitle-1 mt-2">
                ชื่อ-สกุล: <strong>{{ evaluatee?.name_th }}</strong>
            </div>
            <div class="text-subtitle-1">
                รอบการประเมิน: <strong>{{ period?.name_th }} ({{ period?.code }})</strong>
            </div>
        </div>

        <!-- Summary Score Board -->
        <v-row class="mb-6 mx-0 border-b pb-4">
            <v-col cols="6" sm="4" class="text-center">
                <div class="text-caption text-grey-darken-1 mb-1">คะแนนรวม (%)</div>
                <div class="text-h4 text-primary font-weight-bold">{{ report.percentage.toFixed(2) }} %</div>
            </v-col>
            <v-col cols="6" sm="4" class="text-center border-l">
                <div class="text-caption text-grey-darken-1 mb-1">คะแนนเทียบฐาน 60</div>
                <div class="text-h4 text-success font-weight-bold">{{ report.scoreOutOf60.toFixed(2) }}</div>
            </v-col>
            <v-col cols="12" sm="4" class="text-center border-l d-none d-sm-block">
                 <div class="text-caption text-grey-darken-1 mb-1">สถานะ</div>
                 <v-chip color="success" class="mt-2 text-subtitle-1">เสร็จสิ้น</v-chip>
            </v-col>
        </v-row>

        <!-- Topic Breakdown -->
        <div class="text-h6 font-weight-bold mb-3 mt-4 text-decoration-underline">รายละเอียดตามสมรรถนะ</div>
        
        <v-table class="border rounded">
            <thead>
                <tr class="bg-grey-lighten-4">
                    <th class="text-left font-weight-bold py-3">หัวข้อการประเมิน</th>
                    <th class="text-center font-weight-bold py-3">น้ำหนัก</th>
                    <th class="text-center font-weight-bold py-3">คะแนนดิบที่ได้</th>
                    <th class="text-center font-weight-bold py-3">เปอร์เซ็นต์ส่วนนี้</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="t in report.byTopic" :key="t.topic_id">
                    <td class="py-3">
                        <div class="font-weight-medium">{{ t.topic_code }}: {{ t.topic_name }}</div>
                    </td>
                    <td class="text-center py-3">{{ t.topic_weight }}</td>
                    <td class="text-center py-3 text-primary font-weight-bold">
                        {{ t.obtained.toFixed(2) }} / {{ t.max.toFixed(2) }}
                    </td>
                    <td class="text-center py-3">
                        <v-progress-linear
                           :model-value="t.percentage"
                           color="info"
                           height="8"
                           rounded
                        ></v-progress-linear>
                        <div class="text-caption mt-1">{{ t.percentage.toFixed(0) }} %</div>
                    </td>
                </tr>
            </tbody>
        </v-table>
        
        <div class="mt-8 pt-4 border-t text-body-2 text-grey-darken-1">
            * เอกสารนี้สร้างจากระบบเมื่อวันที่: {{ new Date().toLocaleDateString('th-TH') }} <br>
            * สูตรคะแนน: แบบ 1-4 คิดฐานคะแนน ((คะแนน-1)/3) * น้ำหนัก | แบบ ใช่/ไม่ใช่ คิด 1 หรือ 0 * น้ำหนัก
        </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
    .v-application { background: white !important; }
    .report-container { width: 100%; margin: 0; padding: 0; box-shadow: none; }
    body, * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
}
</style>
