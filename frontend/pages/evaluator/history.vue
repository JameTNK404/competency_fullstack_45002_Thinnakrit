<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">
          <v-icon class="mr-2">mdi-history</v-icon>ประวัติการส่งผลการประเมิน
        </h1>
        <p class="text-body-2 text-medium-emphasis">รายการการประเมินที่ฉันเคยส่งผลในแต่ละรอบ</p>
      </v-col>
    </v-row>

    <!-- Filter by Period -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-select
          v-model="selectedPeriod"
          :items="periods"
          item-title="name_th"
          item-value="id"
          label="กรองตามรอบประเมิน"
          clearable
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-calendar-filter"
          @update:modelValue="loadHistory"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="search"
          label="ค้นหาชื่อครู"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          clearable
        />
      </v-col>
    </v-row>

    <!-- Table -->
    <v-data-table
      :headers="headers"
      :items="filteredHistory"
      :loading="loading"
      items-per-page="15"
      class="elevation-2 rounded-lg"
    >
      <template #item.status="{ item }">
        <v-chip
          :color="statusColor(item.status)"
          size="small"
          label
        >
          {{ statusLabel(item.status) }}
        </v-chip>
      </template>

      <template #item.submitted_at="{ item }">
        {{ item.submitted_at ? formatDate(item.submitted_at) : '—' }}
      </template>

      <template #item.updated_at="{ item }">
        {{ formatDate(item.updated_at) }}
      </template>

      <template #item.scored_count="{ item }">
        <v-chip color="primary" size="small" variant="tonal">{{ item.scored_count }} ตัวชี้วัด</v-chip>
      </template>

      <template #no-data>
        <div class="text-center py-6 text-medium-emphasis">
          <v-icon size="40">mdi-clipboard-text-off-outline</v-icon>
          <p class="mt-2">ยังไม่มีประวัติการประเมิน</p>
        </div>
      </template>
    </v-data-table>

    <!-- Error Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
definePageMeta({ middleware: undefined });

const { $api } = useNuxtApp();

const loading = ref(false);
const search = ref('');
const selectedPeriod = ref(null);
const history = ref([]);
const periods = ref([]);
const snackbar = ref({ show: false, text: '', color: 'error' });

const headers = [
  { title: 'รอบประเมิน', key: 'period_name', sortable: true },
  { title: 'ครูที่ถูกประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'ตัวชี้วัดที่ให้คะแนน', key: 'scored_count', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'ส่งผลเมื่อ', key: 'submitted_at', sortable: true },
  { title: 'แก้ไขล่าสุด', key: 'updated_at', sortable: true },
];

const filteredHistory = computed(() => {
  if (!search.value) return history.value;
  const q = search.value.toLowerCase();
  return history.value.filter(h =>
    h.evaluatee_name?.toLowerCase().includes(q) ||
    h.period_name?.toLowerCase().includes(q)
  );
});

const statusColor = (s) => {
  if (s === 'submitted') return 'success';
  if (s === 'locked') return 'error';
  return 'warning';
};

const statusLabel = (s) => {
  if (s === 'submitted') return 'ส่งแล้ว';
  if (s === 'locked') return 'ล็อค';
  return 'แบบร่าง';
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const loadHistory = async () => {
  loading.value = true;
  try {
    const params = selectedPeriod.value ? `?period_id=${selectedPeriod.value}` : '';
    const data = await $api(`/evaluator/history${params}`);
    history.value = data.history || [];
  } catch (e) {
    snackbar.value = { show: true, text: 'โหลดประวัติไม่สำเร็จ', color: 'error' };
  } finally {
    loading.value = false;
  }
};

const loadPeriods = async () => {
  try {
    const data = await $api('/periods/active');
    periods.value = data || [];
  } catch {
    // ถ้า endpoint ไม่มี ใช้ list ว่างก็ได้
  }
};

onMounted(async () => {
  await Promise.all([loadPeriods(), loadHistory()]);
});
</script>
