<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-6 elevation-6">
          <v-card-title class="text-h6 text-center"> Create User </v-card-title>

          <v-card-text>
            <v-form
              @submit.prevent="handleSubmit"
              class="d-flex flex-column ga-4"
            >
              <v-text-field
                label="Name"
                v-model="vals.name_th"
                variant="outlined"
                clearable
                required
              />

              <v-text-field
                label="Email"
                type="email"
                v-model="vals.email"
                variant="outlined"
                clearable
                required
              />

              <!-- ✅ ช่อง Password ที่สามารถแสดง/ซ่อน -->
              <v-text-field
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                v-model="vals.password"
                variant="outlined"
                clearable
                required
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-select
                label="Role"
                v-model="vals.role"
                :items="roles"
                variant="outlined"
                required
              />

              <v-alert
                v-if="errorMsg"
                type="error"
                variant="tonal"
                class="mt-2"
              >
                {{ errorMsg }}
              </v-alert>

              <div class="d-flex justify-end mt-4">
                <v-btn
                  variant="tonal"
                  color="grey"
                  class="mr-2"
                  @click="router.back()"
                >
                  Cancel
                </v-btn>
                <!-- เปลี่ยนเป็นคลิกตรงๆ และให้ type=button -->
                <v-btn
                  type="button"
                  color="primary"
                  variant="flat"
                  @click="handleSubmit"
                >
                  Save
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const errorMsg = ref("");
const showPassword = ref(false); // ✅ state สำหรับ toggle แสดง/ซ่อนรหัสผ่าน

const token = localStorage.getItem("auth_token"); // ดูชื่อ key ให้ตรงกับที่เก็บไว้

const vals = ref({
  name_th: "",
  email: "",
  password: "",
  role: "evaluatee",
});

const roles = ["evaluatee", "evaluator", "admin"];
const handleSubmit = async () => {
  try {
    await axios.post(
      "http://localhost:7000/api/users",
      {
        name_th: vals.value.name_th,
        email: vals.value.email,
        password: vals.value.password,
        role: vals.value.role,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    router.push("/");
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e.message || "Create failed";
  }
};
</script>
