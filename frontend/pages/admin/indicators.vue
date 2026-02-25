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

const topics = ref([])

const defaultItem = { topic_id: null, code: '', name_th: '', description: '', indicator_type: 'score_1_4', is_active: 1 }
const editedIndex = ref(-1)
const editedItem = ref({ ...defaultItem })

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'id', order: 'desc' }]
})

async function loadTopics() {
  try {
    const { data } = await $api.get('/api/topics', { params: { pageSize: 100 } })
    topics.value = data.items
  } catch(e) { console.error('Failed to load topics', e) }
}

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const sortKey = options.value.sortBy?.[0]?.key || 'id'
    const sortDesc = ((options.value.sortBy?.[0]?.order) || 'desc') === 'desc'

    const { data } = await $api.get('/api/indicators', {
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
  loadTopics()
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
  dialog.value = true
}

function askDelete(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  confirmDialog.value = true
}

async function confirmDelete() {
  try {
    await $api.delete(`/api/indicators/${editedItem.value.id}`)
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
      await $api.put(`/api/indicators/${editedItem.value.id}`, editedItem.value)
    } else {
      await $api.post('/api/indicators', editedItem.value)
    }
    close()
    await load()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Save failed'
  }
}

</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4 gap-3">
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="openNew">สร้างตัวชี้วัด</v-btn>
      <div class="flex items-center gap-3 w-full sm:w-80">
        <v-text-field v-model="search" label="ค้นหา (ชื่อ, รหัส)" variant="outlined" density="compact" prepend-inner-icon="mdi-magnify" hide-details class="bg-white rounded" />
      </div>
    </div>

    <v-card>
      <v-card-title class="text-lg">จัดการตัวชี้วัดการประเมิน (Indicators)</v-card-title>
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
            { title:'ชื่อตัวชี้วัด', key:'name_th' },
            { title:'หัวข้อ', key:'topic_name' },
            { title:'ชนิดประเมิน', key:'indicator_type' },
            { title:'สถานะ', key:'is_active' },
            { title:'จัดการ', key:'actions', sortable:false }
          ]"
          :sort-by="options.sortBy"
          @update:sort-by="(s) => options.sortBy = s"
        >
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
    <v-dialog v-model="dialog" max-width="700">
      <v-card>
        <v-card-title class="text-h6">{{ editedIndex === -1 ? 'สร้างตัวชี้วัด' : 'แก้ไขตัวชี้วัด' }}</v-card-title>
        <v-card-text>
          <v-form v-model="formIsValid" @submit.prevent>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.code" label="รหัส (Code)" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field v-model="editedItem.name_th" label="ชื่อตัวชี้วัด" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedItem.description" label="รายละเอียด" rows="2" />
              </v-col>
              <v-col cols="12" sm="12">
                <v-autocomplete
                   v-model="editedItem.topic_id"
                   :items="topics"
                   item-title="title_th"
                   item-value="id"
                   label="อ้างอิงหัวข้อประเมิน"
                   required
                   :rules="[v => !!v || 'Required']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.indicator_type"
                  :items="[{text: 'คะแนน 1-4', value: 'score_1_4'}, {text: 'ใช่/ไม่ใช่', value: 'yes_no'}]"
                  item-title="text"
                  item-value="value"
                  label="ประเภทการให้คะแนน"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
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
          ยืนยันการลบตัวชี้วัด <strong>{{ editedItem.name_th }}</strong>?
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
