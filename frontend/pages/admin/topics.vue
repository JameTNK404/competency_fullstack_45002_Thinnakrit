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

const defaultItem = { code: '', name_th: '', description: '', weight: 0, is_active: 1 }
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

    const { data } = await $api.get('/api/topics', {
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
  dialog.value = true
}

function askDelete(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  confirmDialog.value = true
}

async function confirmDelete() {
  try {
    await $api.delete(`/api/topics/${editedItem.value.id}`)
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
      await $api.put(`/api/topics/${editedItem.value.id}`, editedItem.value)
    } else {
      await $api.post('/api/topics', editedItem.value)
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
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="openNew">สร้างหัวข้อประเมิน</v-btn>
      <div class="flex items-center gap-3">
        <v-text-field v-model="search" label="Search" density="comfortable" hide-details />
      </div>
    </div>

    <v-card>
      <v-card-title class="text-lg">จัดการหัวข้อการประเมิน (Topics)</v-card-title>
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
            { title:'ชื่อหัวข้อ', key:'name_th' },
            { title:'น้ำหนัก', key:'weight' },
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
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6">{{ editedIndex === -1 ? 'สร้างหัวข้อใหม่' : 'แก้ไขหัวข้อ' }}</v-card-title>
        <v-card-text>
          <v-form v-model="formIsValid" @submit.prevent>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.code" label="รหัส (Code)" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field v-model="editedItem.name_th" label="ชื่อหัวข้อ" required :rules="[v => !!v || 'Required']" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedItem.description" label="รายละเอียด" rows="3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.weight" type="number" step="0.01" label="น้ำหนัก (Weight)" required :rules="[v => v >= 0 || 'Must be positive']" />
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
          ยืนยันการลบข้อมูลหัวข้อ <strong>{{ editedItem.name_th }}</strong>?
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
