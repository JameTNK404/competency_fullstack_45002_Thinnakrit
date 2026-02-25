<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">
          <v-icon class="mr-2">mdi-chart-donut</v-icon>รายงานความคืบหน้าการประเมิน
        </h1>
        <p class="text-body-2 text-medium-emphasis">% การประเมินเสร็จสิ้นต่อ period / แผนก</p>
      </v-col>
    </v-row>

    <!-- Filter -->
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
        <v-col cols="auto">
          <v-btn color="primary" prepend-icon="mdi-magnify" :loading="loading" @click="load" :disabled="!selectedPeriod">
            ดูรายงาน
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Summary row -->
    <v-row v-if="stats.length" class="mb-4">
      <v-col cols="12" sm="4">
        <v-card color="primary" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ stats.length }}</div>
          <div class="text-body-2">แผนกทั้งหมด</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card color="success" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ totalSubmitted }}</div>
          <div class="text-body-2">ส่งแล้ว</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card :color="overallPercent >= 80 ? 'success' : overallPercent >= 50 ? 'warning' : 'error'" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ overallPercent.toFixed(1) }}%</div>
          <div class="text-body-2">รวมทุกแผนก</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table -->
    <v-data-table
      v-if="stats.length"
      :headers="headers"
      :items="stats"
      class="elevation-2 rounded-lg"
      items-per-page="20"
    >
      <template #item.percent="{ item }">
        <div class="d-flex align-center gap-2">
          <v-progress-linear
            :model-value="item.percent"
            :color="item.percent >= 80 ? 'success' : item.percent >= 50 ? 'warning' : 'error'"
            height="8"
            rounded
            style="min-width:80px"
          />
          <span class="text-body-2 font-weight-medium">{{ item.percent.toFixed(1) }}%</span>
        </div>
      </template>

      <template #item.submitted="{ item }">
        <v-chip
          :color="item.submitted === item.total ? 'success' : 'warning'"
          size="small"
          variant="tonal"
        >
          {{ item.submitted }} / {{ item.total }}
        </v-chip>
      </template>

      <template #no-data>
        <div class="text-center py-6 text-medium-emphasis">
          <v-icon size="40">mdi-database-off-outline</v-icon>
          <p class="mt-2">กรุณาเลือกรอบการประเมินก่อน</p>
        </div>
      </template>
    </v-data-table>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
  </v-container>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' });

const { $api } = useNuxtApp();
const loading = ref(false);
const selectedPeriod = ref(null);
const periods = ref([]);
const stats = ref([]);
const error = ref('');

const headers = [
  { title: 'แผนก / กลุ่มงาน', key: 'department', sortable: true },
  { title: 'ส่งแล้ว / ทั้งหมด', key: 'submitted', sortable: true },
  { title: '% ความคืบหน้า', key: 'percent', sortable: true },
];

const totalSubmitted = computed(() => stats.value.reduce((s, r) => s + r.submitted, 0));
const totalAll = computed(() => stats.value.reduce((s, r) => s + r.total, 0));
const overallPercent = computed(() => totalAll.value > 0 ? (totalSubmitted.value / totalAll.value) * 100 : 0);

const load = async () => {
  if (!selectedPeriod.value) return;
  loading.value = true;
  error.value = '';
  stats.value = [];
  try {
    // ลอง task5 ก่อน (ส่งเป็น submitted/total/percent)
    const data = await $api(`/task5/reports/progress?period_id=${selectedPeriod.value}`).catch(() => null)
      || await $api(`/reports/progress?period_id=${selectedPeriod.value}`);
    
    const rows = data?.data || data?.progress || [];
    // normalize field names (task5 ใช้ submitted, reports ใช้ completed)
    stats.value = rows.map(r => ({
      department: r.department,
      submitted: r.submitted ?? r.completed ?? 0,
      total: r.total,
      percent: r.percent ?? r.percentage ?? 0,
    }));
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
      await load();
    }
  } catch {}
});
</script>
