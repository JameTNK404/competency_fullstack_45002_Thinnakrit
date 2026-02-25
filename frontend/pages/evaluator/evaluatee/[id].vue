<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()

const evaluateeId = route.params.id

const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const period = ref(null)
const evaluatee = ref(null)
const evaluation = ref([])

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const { data } = await $api.get(`/api/evaluator/evaluatee/${evaluateeId}/evidence`)
    period.value = data.period
    evaluatee.value = data.evaluatee
    evaluation.value = data.evaluation
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function saveScores() {
   saving.value = true
   errorMsg.value = ''
   successMsg.value = ''
   
   const payload = []
   for(const topic of evaluation.value) {
       for(const ind of topic.indicators) {
           // We push all even if null, backend handles it or we could filter out untouched
           payload.push({
               indicator_id: ind.id,
               score: ind.score,
               value_yes_no: ind.value_yes_no,
               notes: ind.notes
           })
       }
   }

   try {
       await $api.post(`/api/evaluator/results/${evaluateeId}`, { scores: payload })
       successMsg.value = 'บันทึกคะแนนเรียบร้อย'
       window.scrollTo({ top: 0, behavior: 'smooth' })
   } catch (e) {
       errorMsg.value = e.response?.data?.message || 'Save failed'
       window.scrollTo({ top: 0, behavior: 'smooth' })
   } finally {
       saving.value = false
   }
}

function goBack() {
    router.push('/evaluator/assignments')
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-h4">ตรวจสอบหลักฐานและให้คะแนน</h1>
        <p class="text-subtitle-1 text-grey-darken-1" v-if="evaluatee">
          ผู้รับการประเมิน: {{ evaluatee.name_th }} ({{ evaluatee.department }})
        </p>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">กลับไปหน้ารายชื่อ</v-btn>
    </div>

    <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4">{{ errorMsg }}</v-alert>
    <v-alert v-if="successMsg" type="success" variant="tonal" class="mb-4">{{ successMsg }}</v-alert>

    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="evaluation.length > 0">
      <v-form @submit.prevent="saveScores">
          <v-expansion-panels variant="accordion" class="mb-6">
            <v-expansion-panel
              v-for="topic in evaluation"
              :key="topic.id"
            >
              <v-expansion-panel-title class="font-weight-bold">
                {{ topic.code }} - {{ topic.title_th }} (น้ำหนัก: {{ topic.weight }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="text-body-2 text-grey-darken-1 mb-4">{{ topic.description }}</div>
                
                <v-card 
                    v-for="ind in topic.indicators" 
                    :key="ind.id"
                    variant="outlined" 
                    class="mb-4"
                >
                  <v-card-text>
                    <v-row>
                        <v-col cols="12" md="7">
                            <div class="text-subtitle-1 font-weight-bold">{{ ind.code }}: {{ ind.name_th }}</div>
                            <div class="text-body-2 mb-2">{{ ind.description }}</div>
                            <div class="text-caption text-grey mb-3">ประเภทประเมิน: {{ ind.indicator_type === 'score_1_4' ? 'คะแนน 1-4' : 'ใช่/ไม่ใช่' }} | น้ำหนัก: {{ ind.weight }}</div>
                            
                            <!-- Attached Files by Evaluatee -->
                            <div class="font-weight-medium mb-1 mt-3">ไฟล์หลักฐานที่แนบมา:</div>
                            <div v-if="ind.attachments && ind.attachments.length > 0">
                                <v-list density="compact" bg-color="transparent">
                                    <v-list-item v-for="att in ind.attachments" :key="att.id" class="px-0">
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-file-download-outline" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title>
                                            <a :href="`/uploads/${att.storage_path}`" target="_blank" class="text-decoration-none text-primary font-weight-medium">
                                                {{ att.file_name }}
                                            </a>
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </div>
                            <div v-else class="text-body-2 text-error mb-3">
                                <v-icon icon="mdi-alert-circle-outline" size="small" class="mr-1"></v-icon> ไม่มีไฟล์หลักฐานแนบมา
                            </div>
                        </v-col>
                        
                        <v-divider vertical class="hidden-sm-and-down mx-3"></v-divider>
                        
                        <!-- Scoring Section -->
                        <v-col cols="12" md="4">
                            <div class="font-weight-medium mb-2 text-primary">ส่วนการให้คะแนน:</div>
                            
                            <div v-if="ind.indicator_type === 'score_1_4'">
                                <v-select
                                    v-model.number="ind.score"
                                    :items="[1,2,3,4]"
                                    label="เลือกคะแนน (1-4)"
                                    variant="outlined"
                                    density="compact"
                                    clearable
                                ></v-select>
                            </div>
                            <div v-else-if="ind.indicator_type === 'yes_no'">
                                <v-radio-group v-model.number="ind.value_yes_no" inline>
                                  <v-radio label="ใช่ (Yes)" :value="1" color="success"></v-radio>
                                  <v-radio label="ไม่ใช่ (No)" :value="0" color="error"></v-radio>
                                </v-radio-group>
                            </div>

                            <v-textarea
                                v-model="ind.notes"
                                label="ข้อเสนอแนะ/บันทึกเพิ่มเติม (ถ้ามี)"
                                rows="2"
                                variant="outlined"
                                density="compact"
                                hide-details
                            ></v-textarea>
                        </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
                
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          
          <div class="d-flex justify-end pt-4 border-t">
              <v-btn color="primary" size="x-large" type="submit" :loading="saving" prepend-icon="mdi-content-save">
                  บันทึกผลการประเมิน
              </v-btn>
          </div>
      </v-form>
    </div>
  </div>
</template>
