<template>
  <v-app>
    <v-main>
      <v-container class="d-flex align-center justify-center" style="min-height: 100vh">
        <v-card max-width="420" class="w-100">
          <v-card-title class="text-h6 text-center">Personnel evaluation system</v-card-title>
          <v-card-text>
            <slot /> <!-- ฟอร์ม login ของเพจ -->
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
