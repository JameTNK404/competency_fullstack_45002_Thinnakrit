<!-- pages/upload.vue -->
<script setup>
definePageMeta({ layout: 'default' })

import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const { $api } = useNuxtApp()
const auth = useAuthStore()

/* ---------- state ---------- */
const loadingInit = ref(false)
const submitting = ref(false)
const progress = ref(0)

const periods = ref([])
const indicators = ref([])
const evidenceTypes = ref([])

const form = ref({
  period_id: null,
  indicator_id: null,
  evidence_type_id: null,
  evaluatee_id: '',        // ใช้เฉพาะ evaluator; evaluatee จะถูกอิงจาก JWT ฝั่ง server
  note: '',
  file: null
})

const rules = {
  required: v => (!!v || v === 0) || 'กรอกข้อมูลให้ครบ',
  select: v => !!v || 'โปรดเลือก',
  file: v => !!v || 'เลือกไฟล์',
  maxMb: mb => v => !v || (v.size <= mb * 1024 * 1024) || `ไฟล์ต้องไม่เกิน ${mb}MB`,
  mimetype: mimes => v => !v || mimes.includes(v.type) || `ชนิดไฟล์ไม่ถูกต้อง (${mimes.join(', ')})`
}

const currentEvType = computed(() =>
  evidenceTypes.value.find(x => x.id === form.value.evidence_type_id) || null
)
const maxMb = computed(() => currentEvType.value?.max_mb ?? 10)
const allowMimes = computed(() => currentEvType.value?.mime_list ?? [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp'
])

const errorMsg = ref('')
const successMsg = ref('')
const showSnack = ref(false)

/* ---------- load master ---------- */
async function init() {
  if (!auth.isLogged) return router.push('/login')
  loadingInit.value = true
  errorMsg.value = ''
  try {
    // งวดที่เปิดใช้งาน
    const { data: pds } = await $api.get('/api/periods/active')
    periods.value = pds || []
    if (!form.value.period_id && periods.value.length) {
      form.value.period_id = periods.value[0].id
    }
    await loadIndicators()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message
  } finally {
    loadingInit.value = false
  }
}

async function loadIndicators() {
  if (!form.value.period_id) return
  indicators.value = []
  evidenceTypes.value = []
  form.value.indicator_id = null
  form.value.evidence_type_id = null
  try {
    const { data } = await $api.get('/api/indicators', {
      params: { period_id: form.value.period_id }
    })
    indicators.value = data || []
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message
  }
}

async function loadEvidenceTypes() {
  if (!form.value.indicator_id) return
  evidenceTypes.value = []
  form.value.evidence_type_id = null
  try {
    const { data } = await $api.get(`/api/indicators/${form.value.indicator_id}/evidence-types`)
    // คาดว่า backend คืน mime_list เป็นอาเรย์ string และ max_mb เป็นตัวเลข
    evidenceTypes.value = (data || []).map(x => ({
      ...x,
      mime_list: Array.isArray(x.mime_list) ? x.mime_list : []
    }))
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message
  }
}

/* ---------- submit ---------- */
async function submit() {
  errorMsg.value = ''
  successMsg.value = ''
  showSnack.value = false

  // ตรวจ validation ขั้นต้น (frontend)
  if (!form.value.period_id || !form.value.indicator_id || !form.value.evidence_type_id || !form.value.file) {
    errorMsg.value = 'กรุณากรอกข้อมูลให้ครบ'
    showSnack.value = true
    return
  }
  // ตรวจไฟล์ตาม evidence type ปัจจุบัน
  const f = form.value.file
  if (f && f.size > maxMb.value * 1024 * 1024) {
    errorMsg.value = `ไฟล์ต้องไม่เกิน ${maxMb.value}MB`
    showSnack.value = true
    return
  }
  if (f && !allowMimes.value.includes(f.type)) {
    errorMsg.value = `ชนิดไฟล์ไม่ถูกต้อง (${allowMimes.value.join(', ')})`
    showSnack.value = true
    return
  }

  // เตรียม multipart
  const fd = new FormData()
  fd.append('period_id', form.value.period_id)
  fd.append('indicator_id', form.value.indicator_id)
  fd.append('evidence_type_id', form.value.evidence_type_id)
  // evaluator เท่านั้นที่กรอก evaluatee_id ได้; evaluatee ห้ามส่งค่านี้ (ให้ backendดึงจาก JWT)
  if (auth.role === 'evaluator' && form.value.evaluatee_id) {
    fd.append('evaluatee_id', form.value.evaluatee_id)
  }
  if (form.value.note) fd.append('note', form.value.note)
  fd.append('file', form.value.file)

  submitting.value = true
  progress.value = 0
  try {
    await $api.post('/api/attachments', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (ev.total) progress.value = Math.round((ev.loaded * 100) / ev.total)
      }
    })
    successMsg.value = 'อัปโหลดสำเร็จ'
    showSnack.value = true
    resetFormKeepMaster()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Upload failed'
    showSnack.value = true
  } finally {
    submitting.value = false
    setTimeout(() => (progress.value = 0), 600)
  }
}

function resetFormKeepMaster() {
  form.value.file = null
  form.value.note = ''
  // คง period/indicator/evidence_type เดิมไว้เผื่ออัปโหลดหลายไฟล์ในหัวข้อเดียวกัน
}

/* ---------- watchers ---------- */
watch(() => form.value.period_id, loadIndicators)
watch(() => form.value.indicator_id, loadEvidenceTypes)

onMounted(init)
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold">Upload Evidence</h1>
      <NuxtLink to="/users">
        <v-btn variant="text">Back</v-btn>
      </NuxtLink>
    </div>

    <v-card>
      <v-card-text>
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mb-4"
        >{{ errorMsg }}</v-alert>

        <v-skeleton-loader
          v-if="loadingInit"
          type="article"
          class="mb-4"
        />

        <div v-else class="grid md:grid-cols-2 gap-6">
          <!-- ฟอร์มเลือกเมตาดาต้า -->
          <div>
            <v-select
              v-model="form.period_id"
              :items="periods"
              item-title="name"
              item-value="id"
              label="รอบการประเมิน (Period)"
              :rules="[rules.select]"
              density="comfortable"
              class="mb-3"
              clearable
            />
            <v-select
              v-model="form.indicator_id"
              :items="indicators"
              :item-title="(i)=> i.code ? `${i.code} — ${i.title}` : i.title"
              item-value="id"
              label="ตัวชี้วัด (Indicator)"
              :rules="[rules.select]"
              density="comfortable"
              class="mb-3"
              clearable
              :disabled="!form.period_id"
            />
            <v-select
              v-model="form.evidence_type_id"
              :items="evidenceTypes"
              item-title="name"
              item-value="id"
              label="ชนิดหลักฐาน (Evidence Type)"
              :rules="[rules.select]"
              density="comfortable"
              class="mb-3"
              clearable
              :disabled="!form.indicator_id"
              hint="ระบบจะตรวจชนิดไฟล์และขนาดตามชนิดหลักฐานนี้"
              persistent-hint
            />

            <!-- เฉพาะ evaluator ที่อัปโหลดแทน -->
            <v-text-field
              v-if="$auth?.role === 'evaluator' || auth.role === 'evaluator'"
              v-model="form.evaluatee_id"
              label="Evaluatee ID (กรณีอัปโหลดแทน)"
              density="comfortable"
              class="mb-3"
              hint="ต้องเป็นคู่ที่ถูกมอบหมายในงวดนี้"
              persistent-hint
            />

            <v-textarea
              v-model="form.note"
              label="หมายเหตุ/คำอธิบายไฟล์ (ไม่บังคับ)"
              auto-grow
              rows="2"
              density="comfortable"
              class="mb-3"
            />
          </div>

          <!-- กล่องอัปโหลดไฟล์ + สรุปเงื่อนไข -->
          <div>
            <v-file-input
              v-model="form.file"
              accept="*/*"
              label="เลือกไฟล์หลักฐาน"
              prepend-icon="mdi-paperclip"
              :rules="[rules.file, rules.maxMb(maxMb), rules.mimetype(allowMimes)]"
              density="comfortable"
              show-size
            />
            <v-alert variant="tonal" type="info" class="mt-3">
              <div class="text-sm">
                <div><strong>ชนิดไฟล์ที่อนุญาต:</strong> {{ allowMimes.join(', ') }}</div>
                <div><strong>ขนาดสูงสุด:</strong> {{ maxMb }} MB</div>
                <div v-if="form.file" class="mt-2">
                  <strong>ตัวอย่างเมตาดาต้าไฟล์:</strong>
                  <ul class="list-disc ml-6">
                    <li>ชื่อไฟล์: {{ form.file.name }}</li>
                    <li>MIME: {{ form.file.type || 'unknown' }}</li>
                    <li>ขนาด: {{ (form.file.size/1024/1024).toFixed(2) }} MB</li>
                  </ul>
                </div>
              </div>
            </v-alert>
          </div>
        </div>

        <v-divider class="my-6" />

        <div class="flex items-center gap-3">
          <v-btn
            color="primary"
            :disabled="submitting || !form.period_id || !form.indicator_id || !form.evidence_type_id || !form.file"
            @click="submit"
          >
            Upload
          </v-btn>

          <v-progress-linear
            v-if="submitting || progress>0"
            :model-value="progress"
            height="6"
            striped
            class="flex-1"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnack" :timeout="3000" location="bottom right">
      <div v-if="successMsg">{{ successMsg }}</div>
      <div v-else>{{ errorMsg }}</div>
      <template #actions>
        <v-btn variant="text" @click="showSnack=false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
