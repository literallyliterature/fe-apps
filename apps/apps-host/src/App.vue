<template>
  <v-app :style="{ background: $route.path === '/minesweeper' ? '#1d1d1d' : '' }">
    <v-main>
      <v-container
        v-if="$route.path !== '/minesweeper'"
        class="fill-height"
        :style="{ 'max-width': $route.path === '/notes' ? '95%' : '900px' }">
        <v-responsive class="fill-height mx-auto">
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
