<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const { $api } = useNuxtApp()
const auth = useAuthStore()

const search = ref('')
const items = ref([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')

const dialog = ref(false)
const confirmDialog = ref(false)
const formIsValid = ref(false)

const defaultItem = { code: '', name_th: '', buddhist_year: new Date().getFullYear() + 543, start_date: '', end_date: '', is_active: 1 }
const editedIndex = ref(-1)
const editedItem = ref({ ...defaultItem })

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'id', order: 'desc' }]
})

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const sortKey = options.value.sortBy?.[0]?.key || 'id'
    const sortDesc = ((options.value.sortBy?.[0]?.order) || 'desc') === 'desc'

    const { data } = await $api.get('/api/periods', {
      params: {
        page: options.value.page,
        pageSize: options.value.itemsPerPage,
        sort: `${sortKey}:${sortDesc ? 'desc' : 'asc'}`,
        q: search.value
      }
    })
    items.value = data.items
    total.value = data.meta.total
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})

watch(options, load, { deep: true })
watch(search, () => { options.value.page = 1; load() })

function openNew() {
  editedItem.value = { ...defaultItem }
  editedIndex.value = -1
  dialog.value = true
}

function editItem(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  if (editedItem.value.start_date) {
    editedItem.value.start_date = editedItem.value.start_date.split('T')[0]
  }
  if (editedItem.value.end_date) {
    editedItem.value.end_date = editedItem.value.end_date.split('T')[0]
  }
  dialog.value = true
}

function askDelete(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  confirmDialog.value = true
}

async function confirmDelete() {
  try {
    await $api.delete(`/api/periods/${editedItem.value.id}`)
    confirmDialog.value = false
    await load()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Delete failed'
    confirmDialog.value = false
  }
}

function close() {
  dialog.value = false
}

async function save() {
  if (!formIsValid.value) return
  errorMsg.value = ''
  try {
    if (editedIndex.value > -1) {
      await $api.put(`/api/periods/${editedItem.value.id}`, editedItem.value)
    } else {
      await $api.post('/api/periods', editedItem.value)
    }
    close()
    await load()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Save failed'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' })
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4 gap-3">
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="openNew">สร้างรอบการประเมิน</v-btn>
      <div class="flex items-center gap-3">
        <v-text-field v-model="search" label="Search" density="comfortable" hide-details />
      </div>
    </div>

    <v-card>
      <v-card-title class="text-lg">จัดการรอบการประเมิน (Periods)</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-3">{{ errorMsg }}</v-alert>

        <v-data-table-server
          v-model:items-per-page="options.itemsPerPage"
          v-model:page="options.page"
          :items-length="total"
          :items="items"
          :loading="loading"
          :headers="[
            { title:'รหัส', key:'code' },
            { title:'ชื่อ', key:'name_th' },
            { title:'ปีการศึกษา', key:'buddhist_year' },
            { title:'วันที่เริ่ม', key:'start_date' },
            { title:'วันที่สิ้นสุด', key:'end_date' },
            { title:'สถานะ', key:'is_active' },
            { title:'จัดการ', key:'actions', sortable:false }
          ]"
          :sort-by="options.sortBy"
          @update:sort-by="(s) => options.sortBy = s"
        >
          <template #item.start_date="{ item }">
            {{ formatDate(item.start_date) }}
          </template>
          <template #item.end_date="{ item }">
            {{ formatDate(item.end_date) }}
          </template>
          <template #item.is_active="{ item }">
            <v-chip :color="item.is_active ? 'success' : 'grey'" size="small">
              {{ item.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" @click="editItem(item)">Edit</v-btn>
            <v-btn size="small" color="error" variant="text" @click="askDelete(item)">Delete</v-btn>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Dialog for Create / Edit -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6">{{ editedIndex === -1 ? 'สร้างรอบใหม่' : 'แก้ไขรอบ' }}</v-card-title>
        <v-card-text>
          <v-form v-model="formIsValid" @submit.prevent>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.code" label="รหัส (Code)" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.buddhist_year" label="ปี พ.ศ." type="number" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedItem.name_th" label="ชื่อรอบ" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.start_date" type="date" label="วันที่เริ่ม" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.end_date" type="date" label="วันที่สิ้นสุด" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12">
                <v-switch v-model="editedItem.is_active" :true-value="1" :false-value="0" color="success" label="เปิดใช้งาน (Active)" hide-details></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="save" :disabled="!formIsValid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirm Delete -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          ยืนยันการลบข้อมูลรอบประเมิน <strong>{{ editedItem.name_th }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
