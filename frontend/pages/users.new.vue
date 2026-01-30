<script setup lang="ts">
definePageMeta({ layout: 'daisy' })
const router = useRouter()
const config = useRuntimeConfig()
const name = ref('')
const email = ref('')
const password = ref('')
const role = ref('user')
const errorMsg = ref('')

const token = process.client ? localStorage.getItem('token') : null
const headers:any = token ? { Authorization: `Bearer ${token}` } : {}

async function createUser(){
  try{
    await $fetch(`${config.public.apiBase}/api/users`, {
      method: 'POST',
      headers: { ...headers },
      body: { name: name.value, email: email.value, password: password.value, role: role.value }
    })
    router.push('/')
  }catch(e:any){
    errorMsg.value = e?.data?.message || e.message || 'Create failed'
  }
}
</script>

<template>
  <main style="max-width: 520px; margin: 2rem auto; padding: 1rem;">
    <h2>Create User</h2>
    <div style="display:flex; flex-direction:column; gap:.5rem;">
      <input v-model="name" placeholder="Name" />
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <select v-model="role">
        <option value="user">user</option>
        <option value="evaluator">evaluator</option>
        <option value="admin">admin</option>
      </select>
      <button @click="createUser">Save</button>
      <small v-if="errorMsg" style="color:red">{{ errorMsg }}</small>
    </div>
  </main>
</template>
