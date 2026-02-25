<script setup>
definePageMeta({ layout: 'default' })
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
const confirmDialog = ref(false)
const selectedUser = ref(null)

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'id', order: 'desc' }]
})

// โหลดข้อมูล
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
        sortDesc,
        search: search.value
      }
    })
    items.value = data.items
    total.value = data.total
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!auth.isLogged) {
    router.push('/login')
    return
  }
  load()
})
watch(options, load, { deep: true })
watch(search, () => { options.value.page = 1; load() })

function logout() {
  auth.logout()
  router.push('/login')
}

/* ✅ เรียกตอนกดปุ่ม Delete */
function askDelete(user) {
  selectedUser.value = user
  confirmDialog.value = true
}

/* ✅ เมื่อกดยืนยันใน dialog */
async function confirmDelete() {
  try {
    await $api.delete(`/api/users/${selectedUser.value.id}`)
    confirmDialog.value = false
    selectedUser.value = null
    await load()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Delete failed'
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4 gap-3">
      <div class="flex items-center gap-3">
        <NuxtLink to="/users/new">
          <v-btn color="primary" variant="elevated">Create User</v-btn>
        </NuxtLink>
        <a href="http://localhost:7000/docs" target="_blank">
          <v-btn variant="tonal">Open API Docs</v-btn>
        </a>
        <NuxtLink to="/upload">
          <v-btn variant="tonal">Upload</v-btn>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <v-text-field v-model="search" label="Search" density="comfortable" hide-details />
        <v-btn color="error" @click="logout">Logout</v-btn>
      </div>
    </div>

    <v-card>
      <v-card-title class="text-lg">Users</v-card-title>
      <v-card-text>
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mb-3"
        >
          {{ errorMsg }}
        </v-alert>

        <v-data-table-server
          v-model:items-per-page="options.itemsPerPage"
          v-model:page="options.page"
          :items-length="total"
          :items="items"
          :loading="loading"
          :headers="[
            { title:'ID', key:'id' },
            { title:'Name', key:'name_th' },
            { title:'Email', key:'email' },
            { title:'Role', key:'role' },
            { title:'Created', key:'created_at' },
            { title:'Actions', key:'actions', sortable:false }
          ]"
          :sort-by="options.sortBy"
          @update:sort-by="(s) => options.sortBy = s"
        >
          <template #item.actions="{ item }">
            <NuxtLink :to="`/users/${item.id}`">
              <v-btn size="small" variant="text">Edit</v-btn>
            </NuxtLink>
            <v-btn
              size="small"
              color="error"
              variant="text"
              @click="askDelete(item)"
            >
              Delete
            </v-btn>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- ✅ Dialog Confirm Delete -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Delete user <strong>#{{ selectedUser?.id }}</strong> ({{ selectedUser?.name_th }}) ?
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
