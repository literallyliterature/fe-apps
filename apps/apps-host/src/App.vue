<template>
  <v-app>
    <v-app-bar
      v-if="$route.path !== '/'"
      app
      class="pl-2 pt-2"
      color="transparent"
      flat>
      <router-link to="/">
        <img src="@/assets/logo.png" alt="Logo" style="width: 42px; height: auto;" />
      </router-link>
    </v-app-bar>

    <v-main>
      <v-container class="fill-height">

        <v-responsive
          class="fill-height mx-auto"
          max-width="900">
          <router-view />
        </v-responsive>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>
