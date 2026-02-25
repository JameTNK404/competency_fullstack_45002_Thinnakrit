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

const periods = ref([])
const evaluators = ref([])
const evaluatees = ref([])

const defaultItem = { period_id: null, evaluator_id: null, evaluatee_id: null, department: '' }
const editedIndex = ref(-1)
const editedItem = ref({ ...defaultItem })

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'id', order: 'desc' }]
})

async function loadDropdowns() {
  try {
    const [pRes, evRes, evalRes] = await Promise.all([
      $api.get('/api/periods', { params: { pageSize: 100, sort: 'id:desc' } }),
      $api.get('/api/users/server', { params: { pageSize: 1000 } }), // Evaluators (could be role filtered but logic depends)
      $api.get('/api/users/server', { params: { pageSize: 1000 } })  // Evaluatees
    ]);
    
    periods.value = pRes.data.items;
    
    // Simplification: We assume admins can map any active users, but to be clean we filter logically
    evaluators.value = evRes.data.items.filter(u => u.role === 'evaluator' || u.role === 'admin');
    evaluatees.value = evalRes.data.items.filter(u => u.role === 'evaluatee' || u.role === 'evaluator' || u.role === 'admin'); // Evaluatees are typically everyone
  } catch(e) { console.error('Failed to load dropdowns', e) }
}

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const sortKey = options.value.sortBy?.[0]?.key || 'id'
    const sortDesc = ((options.value.sortBy?.[0]?.order) || 'desc') === 'desc'

    const { data } = await $api.get('/api/assignments', {
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
  loadDropdowns()
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
    await $api.delete(`/api/assignments/${editedItem.value.id}`)
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
      await $api.put(`/api/assignments/${editedItem.value.id}`, editedItem.value)
    } else {
      await $api.post('/api/assignments', editedItem.value)
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
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="openNew">มอบหมายการประเมิน</v-btn>
      <div class="flex items-center gap-3 w-full sm:w-80">
        <v-text-field v-model="search" label="ค้นหา (ชื่อ, แผนก)" variant="outlined" density="compact" prepend-inner-icon="mdi-magnify" hide-details class="bg-white rounded" />
      </div>
    </div>

    <v-card>
      <v-card-title class="text-lg">การตั้งค่ามอบหมายผู้ประเมิน (Assignments)</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-3">{{ errorMsg }}</v-alert>

        <v-data-table-server
          v-model:items-per-page="options.itemsPerPage"
          v-model:page="options.page"
          :items-length="total"
          :items="items"
          :loading="loading"
          :headers="[
            { title:'รอบประเมิน', key:'period_name' },
            { title:'ผู้ประเมิน (Evaluator)', key:'evaluator_name' },
            { title:'ผู้รับการประเมิน (Evaluatee)', key:'evaluatee_name' },
            { title:'แผนก', key:'department' },
            { title:'จัดการ', key:'actions', sortable:false }
          ]"
          :sort-by="options.sortBy"
          @update:sort-by="(s) => options.sortBy = s"
        >
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
        <v-card-title class="text-h6">{{ editedIndex === -1 ? 'มอบหมายใหม่' : 'แก้ไขมอบหมาย' }}</v-card-title>
        <v-card-text>
          <v-form v-model="formIsValid" @submit.prevent>
            <v-row>
              <v-col cols="12" sm="12">
                <v-autocomplete
                   v-model="editedItem.period_id"
                   :items="periods"
                   item-title="name_th"
                   item-value="id"
                   label="รอบการประเมิน"
                   required
                   :rules="[v => !!v || 'Required']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                   v-model="editedItem.evaluator_id"
                   :items="evaluators"
                   item-title="name_th"
                   item-value="id"
                   label="ผู้ประเมิน (Evaluator)"
                   required
                   :rules="[v => !!v || 'Required']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                   v-model="editedItem.evaluatee_id"
                   :items="evaluatees"
                   item-title="name_th"
                   item-value="id"
                   label="ผู้รับการประเมิน (Evaluatee)"
                   required
                   :rules="[v => !!v || 'Required']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="12">
                <v-text-field v-model="editedItem.department" label="แผนก/สายวิชา" required :rules="[v => !!v || 'Required']" />
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
          ยืนยันการลบการมอบหมายนี้?
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
