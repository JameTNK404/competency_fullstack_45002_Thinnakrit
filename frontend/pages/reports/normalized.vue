<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">
          <v-icon class="mr-2">mdi-chart-bar</v-icon>รายงาน Normalized Score /60
        </h1>
        <p class="text-body-2 text-medium-emphasis">คะแนนรวมปรับระดับ (Normalized) รายบุคคล</p>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4 pa-4" variant="outlined">
      <v-row align="center">
        <v-col cols="12" sm="4">
          <v-select
            v-model="selectedPeriod"
            :items="periods"
            item-title="name_th"
            item-value="id"
            label="รอบการประเมิน *"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-calendar"
          />
        </v-col>
        <v-col cols="12" sm="4" v-if="isAdmin">
          <v-text-field
            v-model="evaluateeId"
            label="evaluatee_id (เว้นว่าง=ทุกคน)"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-account"
            type="number"
          />
        </v-col>
        <v-col cols="auto">
          <v-btn color="primary" prepend-icon="mdi-magnify" :loading="loading" @click="load" :disabled="!selectedPeriod">
            ดูรายงาน
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Result -->
    <template v-if="result">
      <!-- Summary Card -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card color="primary" variant="tonal" class="text-center pa-4">
            <div class="text-h3 font-weight-bold">{{ result.scoreData.scoreOutOf60.toFixed(2) }}</div>
            <div class="text-body-2">คะแนนรวม / 60</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card color="success" variant="tonal" class="text-center pa-4">
            <div class="text-h3 font-weight-bold">{{ result.scoreData.percentage.toFixed(2) }}%</div>
            <div class="text-body-2">เปอร์เซ็นต์รวม</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card color="info" variant="tonal" class="text-center pa-4">
            <div class="text-h5 font-weight-bold mt-2">{{ result.evaluatee?.name_th || 'ทุกคน' }}</div>
            <div class="text-body-2">ผู้ถูกประเมิน</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- By Topic Table -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4">คะแนนแยกตามหัวข้อ (A5-1 ถึง A5-4)</v-card-title>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>หัวข้อ</th>
              <th class="text-right">น้ำหนัก</th>
              <th class="text-right">คะแนนที่ได้</th>
              <th class="text-right">คะแนนเต็ม</th>
              <th class="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in result.scoreData.byTopic" :key="t.topic_id">
              <td>{{ t.code }} — {{ t.name_th }}</td>
              <td class="text-right">{{ t.weight }}</td>
              <td class="text-right font-weight-medium">{{ t.obtained.toFixed(2) }}</td>
              <td class="text-right">{{ t.max }}</td>
              <td class="text-right">
                <v-chip size="x-small" :color="t.percentage >= 60 ? 'success' : 'warning'" variant="tonal">
                  {{ t.percentage.toFixed(1) }}%
                </v-chip>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-weight-bold bg-grey-lighten-4">
              <td>รวม</td>
              <td></td>
              <td class="text-right">{{ result.scoreData.totalObtained.toFixed(2) }}</td>
              <td class="text-right">{{ result.scoreData.totalMax }}</td>
              <td class="text-right">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ result.scoreData.scoreOutOf60.toFixed(2) }} / 60
                </v-chip>
              </td>
            </tr>
          </tfoot>
        </v-table>
      </v-card>

      <!-- Print button -->
      <div class="text-right">
        <v-btn color="grey" prepend-icon="mdi-printer" variant="outlined" @click="() => window.print()">
          พิมพ์ / บันทึก PDF
        </v-btn>
      </div>
    </template>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' });

const { $api } = useNuxtApp();
const { useAuthStore } = await import('~/stores/auth');
const auth = useAuthStore();
const isAdmin = computed(() => auth.user?.role === 'admin');

const loading = ref(false);
const selectedPeriod = ref(null);
const evaluateeId = ref('');
const periods = ref([]);
const result = ref(null);
const error = ref('');
const snackbar = ref({ show: false, text: '', color: 'error' });

const load = async () => {
  if (!selectedPeriod.value) return;
  loading.value = true;
  error.value = '';
  result.value = null;
  try {
    let url;
    if (isAdmin.value && evaluateeId.value) {
      url = `/reports/normalized/${evaluateeId.value}?period_id=${selectedPeriod.value}`;
    } else if (auth.user?.role === 'evaluatee') {
      url = `/reports/normalized/${auth.user.id}?period_id=${selectedPeriod.value}`;
    } else if (isAdmin.value) {
      // Admin without specific evaluatee — show via task3 endpoint
      url = `/reports/normalized/${evaluateeId.value || 1}?period_id=${selectedPeriod.value}`;
    }
    const data = await $api(url);
    result.value = data;
  } catch (e) {
    error.value = e?.data?.message || 'โหลดรายงานไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    const data = await $api('/periods/active');
    periods.value = Array.isArray(data) ? data : [data].filter(Boolean);
    if (periods.value.length === 1) {
      selectedPeriod.value = periods.value[0].id;
      // auto-load for evaluatee
      if (auth.user?.role === 'evaluatee') await load();
    }
  } catch {}
});
</script>

<style>
@media print {
  .v-navigation-drawer, .v-app-bar, .v-btn { display: none !important; }
}
</style>
