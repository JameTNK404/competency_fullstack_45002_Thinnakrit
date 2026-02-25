<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">
          <v-icon class="mr-2">mdi-clipboard-account-outline</v-icon>ผลการประเมินของฉัน
        </h1>
        <p v-if="period" class="text-body-2 text-medium-emphasis">รอบ: {{ period.name_th }}</p>
      </v-col>
      <v-col cols="auto" class="d-flex align-center gap-2">
        <NuxtLink to="/me/evidence">
          <v-btn color="primary" prepend-icon="mdi-upload" variant="tonal" size="small">อัพโหลดหลักฐาน</v-btn>
        </NuxtLink>
        <NuxtLink to="/me/report">
          <v-btn color="success" prepend-icon="mdi-printer" variant="tonal" size="small">พิมพ์รายงาน</v-btn>
        </NuxtLink>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- No Period -->
    <v-alert v-if="!loading && !period" type="warning" variant="tonal">
      ยังไม่มีรอบการประเมินที่เปิดใช้งาน
    </v-alert>

    <!-- Not Assigned -->
    <v-alert v-if="!loading && period && !evaluation.length" type="info" variant="tonal">
      ยังไม่ได้รับการมอบหมายประเมินในรอบนี้
    </v-alert>

    <!-- Topics → Indicators grouped -->
    <v-expansion-panels v-if="!loading && evaluation.length" multiple variant="accordion">
      <v-expansion-panel
        v-for="topic in evaluation"
        :key="topic.id"
        class="mb-2"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between w-100">
            <span class="font-weight-medium">{{ topic.code }} — {{ topic.name_th }}</span>
            <v-chip size="small" color="primary" variant="tonal" class="mr-4">
              น้ำหนัก {{ topic.weight }}%
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ตัวชี้วัด</th>
                <th>ประเภท</th>
                <th>หลักฐาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ind in topic.indicators" :key="ind.id">
                <td>{{ ind.code }}</td>
                <td>{{ ind.name_th }}</td>
                <td>
                  <v-chip size="x-small" :color="ind.type === 'score_1_4' ? 'blue' : 'purple'" variant="tonal">
                    {{ ind.type === 'score_1_4' ? 'คะแนน 1-4' : 'ใช่/ไม่ใช่' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    size="x-small"
                    :color="ind.attachments?.length ? 'success' : 'warning'"
                    variant="tonal"
                  >
                    {{ ind.attachments?.length || 0 }} ไฟล์
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    size="x-small"
                    :color="ind.attachments?.length ? 'success' : 'grey'"
                    variant="tonal"
                  >
                    {{ ind.attachments?.length ? 'มีหลักฐาน' : 'รอหลักฐาน' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' });

const { $api } = useNuxtApp();
const loading = ref(false);
const period = ref(null);
const evaluation = ref([]);
const snackbar = ref({ show: false, text: '', color: 'error' });

onMounted(async () => {
  loading.value = true;
  try {
    const data = await $api('/me/evaluation');
    period.value = data.period || null;
    evaluation.value = data.evaluation || [];
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'โหลดข้อมูลไม่สำเร็จ';
    snackbar.value = { show: true, text: msg, color: 'error' };
  } finally {
    loading.value = false;
  }
});
</script>
