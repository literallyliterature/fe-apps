<template>
  <v-container class="fill-height">
    <v-responsive
      class="fill-height mx-auto"
      max-width="900">
      <v-row
        align-content="center"
        class="fill-height"
        justify="center">
        <v-col cols="12">
          <router-link to="/">
            <v-img
              class="mb-4"
              height="150"
              src="@/assets/logo.png" />
          </router-link>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            append-icon="fas fa-th"
            class="py-4"
            color="pink-lighten-1"
            rounded="lg"
            title="Sudoku"
            to="/sudoku" />
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            append-icon="fas fa-bomb"
            class="py-4"
            color="pink-lighten-1"
            rounded="lg"
            title="Minesweeper"
            to="/minesweeper" />
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            append-icon="fas fa-list"
            class="py-4"
            color="pink-lighten-1"
            rounded="lg"
            title="Notes"
            to="/notes" />
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script setup lang="ts">
  //
</script>
