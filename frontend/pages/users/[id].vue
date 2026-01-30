<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const auth = useAuthStore()

const id = computed(() => route.params.id)
const errorMsg = ref('')
const loading = ref(false)

/* ✅ 1) แก้ schema ให้รองรับ evaluatee */
const schema = yup.object({
  name: yup.string().required('กรอกชื่อ'),
  email: yup.string().email('อีเมลไม่ถูกต้อง').required('กรอกอีเมล'),
  role: yup.string().oneOf(['evaluatee', 'evaluator', 'admin'], 'เลือกบทบาทให้ถูกต้อง').required('เลือกบทบาท')
})

/* ฟอร์ม */
const { handleSubmit, setValues } = useForm({ validationSchema: schema })
const { value: name,  errorMessage: nameErr }  = useField('name')
const { value: email, errorMessage: emailErr } = useField('email')
const { value: role,  errorMessage: roleErr }  = useField('role')

/* ใช้ items แบบมี label/value จะอ่านง่ายและกันพิมพ์ผิด */
const roleItems = [
  { title: 'Evaluatee', value: 'evaluatee' },
  { title: 'Evaluator', value: 'evaluator' },
  { title: 'Admin',     value: 'admin' }
]

onMounted(async () => {
  try {
    loading.value = true
    const res = await axios.get(`${config.public.apiBase}/api/users/${id.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    const u = res.data.data
    setValues({
      /* ✅ 2) map name_th -> name สำหรับแสดงผล */
      name:  u.name_th ?? '',
      email: u.email   ?? '',
      role:  u.role    ?? 'evaluatee'
    })
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
})

/* ✅ 3) ตอนอัปเดต map กลับเป็น name_th ให้ backend */
const onSubmit = handleSubmit(async (values) => {
  try {
    loading.value = true
    await axios.put(
      `${config.public.apiBase}/api/users/${id.value}`,
      { name_th: values.name, email: values.email, role: values.role },
      { headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' } }
    )
    router.push('/')
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Update failed'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-xl">
    <v-card>
      <v-card-title>Edit User #{{ id }}</v-card-title>
      <v-card-text>
        <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <v-text-field v-model="name"  label="Name"  :error-messages="nameErr ? [nameErr] : []" />
          <v-text-field v-model="email" label="Email" :error-messages="emailErr ? [emailErr] : []" />
          <!-- ✅ ใช้ items แบบ object และ schema ตรงกับ evaluatee -->
          <v-select
            v-model="role"
            :items="roleItems"
            item-title="title"
            item-value="value"
            label="Role"
            :error-messages="roleErr ? [roleErr] : []"
          />
          <v-alert v-if="errorMsg" type="error" variant="tonal">{{ errorMsg }}</v-alert>
          <v-card-actions class="px-0">
            <v-spacer />
            <NuxtLink to="/"><v-btn variant="text">Back</v-btn></NuxtLink>
            <v-btn :loading="loading" color="primary" type="submit">Save</v-btn>
          </v-card-actions>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>
