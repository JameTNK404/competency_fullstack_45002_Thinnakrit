<!-- ~/pages/admin/users.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4 gap-3">
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="openNew">เพิ่มผู้ใช้งาน</v-btn>
      <div class="flex items-center gap-3">
        <v-text-field v-model="search" label="ค้นหา (ชื่อ, อีเมล)" density="comfortable" hide-details />
      </div>
    </div>

    <v-card>
      <v-card-title class="text-lg">จัดการผู้ใช้งาน (Users)</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-3">{{ errorMsg }}</v-alert>

        <v-data-table-server
          v-model:items-per-page="options.itemsPerPage"
          v-model:page="options.page"
          :items-length="total"
          :items="items"
          :loading="loading"
          :headers="[
            { title:'ID', key:'id' },
            { title:'ชื่อ-นามสกุล', key:'name_th' },
            { title:'อีเมล', key:'email' },
            { title:'บทบาท', key:'role' },
            { title:'วันลงทะเบียน', key:'created_at' },
            { title:'จัดการ', key:'actions', sortable:false }
          ]"
          :sort-by="options.sortBy"
          @update:sort-by="(s) => options.sortBy = s"
        >
          <template #item.role="{ item }">
            <v-chip :color="roleColor(item.role)" size="small">
              {{ item.role }}
            </v-chip>
          </template>
           <template #item.created_at="{ item }">
              {{ new Date(item.created_at).toLocaleDateString('th-TH') }}
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
        <v-card-title class="text-h6">{{ editedIndex === -1 ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขข้อมูลผู้ใช้' }}</v-card-title>
        <v-card-text>
          <v-form v-model="formIsValid" @submit.prevent>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="editedItem.name_th" label="ชื่อ-นามสกุล" required :rules="[v => !!v || 'กรุณากรอกชื่อ']" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.email" type="email" label="อีเมล" required :rules="[v => !!v || 'กรุณากรอกอีเมล']" />
              </v-col>
              <v-col cols="12" sm="6">
                <!-- Require password only on create -->
                <v-text-field 
                  v-model="editedItem.password" 
                  type="password" 
                  label="รหัสผ่าน" 
                  :rules="editedIndex === -1 ? [v => !!v || 'กรุณากรอกรหัสผ่าน (สร้างใหม่บังคับ)'] : []"
                  :placeholder="editedIndex > -1 ? 'ปล่อยว่างถ้าไม่เปลี่ยน' : ''"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.role"
                  :items="['admin', 'evaluator', 'evaluatee']"
                  label="บทบาท (Role)"
                  required
                  :rules="[v => !!v || 'กรุณาเลือกบทบาท']"
                />
              </v-col>
               <v-col cols="12" sm="6">
                 <v-select
                    v-model="editedItem.department_id"
                    :items="departments"
                    item-title="name_th"
                    item-value="id"
                    label="แผนกวิชา (ถ้ามี)"
                    clearable
                  ></v-select>
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
        <v-card-title class="text-h6">ลบผู้ใช้งาน</v-card-title>
        <v-card-text>
          ยืนยันการลบผู้ใช้ <strong>{{ editedItem.name_th }} ({{ editedItem.email }})</strong>?
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

<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, onMounted, watch } from 'vue'

const router = useRouter()
const { $api } = useNuxtApp()

const search = ref('')
const items = ref([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')

const dialog = ref(false)
const confirmDialog = ref(false)
const formIsValid = ref(false)

const defaultItem = { name_th: '', email: '', password: '', role: 'evaluatee', department_id: null }
const editedIndex = ref(-1)
const editedItem = ref({ ...defaultItem })

const departments = ref([])

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'id', order: 'desc' }]
})

async function loadDepartments() {
    try {
        const { data } = await $api.get('/api/users/departments')
        departments.value = data
    } catch(e) {}
}

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const sortKey = options.value.sortBy?.[0]?.key || 'id'
    const sortDesc = ((options.value.sortBy?.[0]?.order) || 'desc') === 'desc'

    const { data } = await $api.get('/api/users/server', {
      params: {
        page: options.value.page,
        itemsPerPage: options.value.itemsPerPage,
        sortBy: sortKey,
        sortDesc: sortDesc,
        search: search.value
      }
    })
    
    // Use the paginated items array from /api/users/server
    items.value = data.items
    total.value = data.total
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDepartments()
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
  editedItem.value = { ...item, password: '' } // clear password field on edit mode
  dialog.value = true
}

function askDelete(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = { ...item }
  confirmDialog.value = true
}

async function confirmDelete() {
  try {
    await $api.delete(`/api/users/${editedItem.value.id}`)
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
    // remove empty password field if editing
    const payload = { ...editedItem.value }
    if (editedIndex.value > -1 && !payload.password) {
        delete payload.password
    }

    if (editedIndex.value > -1) {
      await $api.put(`/api/users/${editedItem.value.id}`, payload)
    } else {
      await $api.post('/api/users', payload)
    }
    close()
    await load()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Save failed'
  }
}

function roleColor(role) {
    if (role === 'admin') return 'error'
    if (role === 'evaluator') return 'warning'
    return 'primary'
}
</script>
