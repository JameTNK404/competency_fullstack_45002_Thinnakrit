<!-- ~/pages/register.vue -->
<template>
  <div class="container mx-auto px-4 py-12 max-w-md">
    <v-card>
      <v-card-title class="text-xl">สมัครสมาชิก (สำหรับครูผู้สอน)</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="isValid" @submit.prevent="onSubmit" class="flex flex-col gap-4">
          <v-text-field
            v-model="name_th"
            label="ชื่อ-นามสกุล"
            :rules="[r => !!r || 'กรุณากรอกชื่อ-นามสกุล']"
            prepend-inner-icon="mdi-account-outline"
            required
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model="email"
            label="อีเมล"
            type="email"
            :rules="[r => !!r || 'กรุณากรอกอีเมล', r => /.+@.+\..+/.test(r) || 'อีเมลไม่ถูกต้อง']"
            prepend-inner-icon="mdi-email-outline"
            required
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model="password"
            label="รหัสผ่าน"
            :type="showPw ? 'text' : 'password'"
            :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPw = !showPw"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[r => !!r || 'กรุณากรอกรหัสผ่าน', r => r.length >= 6 || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร']"
            required
            variant="outlined"
            density="comfortable"
          />

          <!-- Departments Select -->
          <v-select
            v-model="department_id"
            :items="departments"
            item-title="name_th"
            item-value="id"
            label="แผนกวิชา"
            :rules="[r => !!r || 'กรุณาเลือกแผนกวิชา']"
            prepend-inner-icon="mdi-domain"
            required
            variant="outlined"
            density="comfortable"
          ></v-select>

           <!-- Org Groups Select -->
           <v-select
            v-model="org_group_id"
            :items="orgGroups"
            item-title="name_th"
            item-value="id"
            label="กลุ่มงาน / ฝ่าย"
            :rules="[r => !!r || 'กรุณาเลือกกลุ่มงาน/ฝ่าย']"
            prepend-inner-icon="mdi-account-group-outline"
            required
            variant="outlined"
            density="comfortable"
          ></v-select>

          <v-alert v-if="errorMsg" type="error" density="comfortable" variant="tonal" class="mt-2">
            {{ errorMsg }}
          </v-alert>

           <v-alert v-if="successMsg" type="success" density="comfortable" variant="tonal" class="mt-2">
            {{ successMsg }}
          </v-alert>

          <v-card-actions class="px-0 mt-4 d-flex justify-space-between">
             <NuxtLink to="/login" class="text-primary text-body-2 text-decoration-none">
              มีบัญชีแล้ว? เข้าสู่ระบบ
            </NuxtLink>
            <v-btn :loading="loading" color="primary" type="submit" variant="elevated" :disabled="!isValid">ยืนยันสมัครสมาชิก</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'auth-login', ssr: false })

const { $api } = useNuxtApp()
const router = useRouter()

const isValid = ref(false)
const name_th = ref('')
const email = ref('')
const password = ref('')
const department_id = ref(null)
const org_group_id = ref(null)

const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// Dropdown data
const departments = ref([])
const orgGroups = ref([])

onMounted(async () => {
  await fetchMasterData()
})

const fetchMasterData = async () => {
    try {
        // We will fetch departments and orgGroups for the registration form
        // assuming standard unauthenticated access or minimal access if required
        const [deptRes, orgRes] = await Promise.all([
             $api.get('/api/users/departments'),
             $api.get('/api/users/org_groups')
        ])
        if (deptRes.data) departments.value = deptRes.data
        if (orgRes.data) orgGroups.value = orgRes.data
    } catch (e) {
        console.error('Failed to load master data for registration', e)
    }
}

const onSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  try {
    const payload = {
        name_th: name_th.value,
        email: email.value,
        password: password.value,
        department_id: department_id.value,
        org_group_id: org_group_id.value
    }
    const { data } = await $api.post('/api/auth/register', payload)
    
    if (data?.success) {
      successMsg.value = 'สมัครสมาชิกสำเร็จ กำลังพาท่านไปหน้าเข้าสู่ระบบ...'
      setTimeout(() => {
          router.push('/login')
      }, 2000)
    } else {
      errorMsg.value = data?.message || 'การสมัครสมาชิกล้มเหลว'
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Registration error'
    console.error('REGISTER ERROR:', e)
  } finally {
    loading.value = false
  }
}
</script>
