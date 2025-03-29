<template>
  <v-app :style="{ background: $route.path === '/minesweeper' ? '#1d1d1d' : '' }">
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
      <v-container
        v-if="$route.path !== '/minesweeper'"
        class="fill-height">
        <v-responsive
          class="fill-height mx-auto"
          max-width="900">
          <router-view />
        </v-responsive>
      </v-container>

      <div v-else style="overflow: scroll; width: 100vw">
        <div class="pa-8">
          <router-view />
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>
