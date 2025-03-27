<template>
  <v-container class="fill-height">
    <v-responsive
      class="fill-height mx-auto"
      max-width="900">
      <v-row
        align-content="center"
        class="fill-height"
        justify="center">
        <v-col cols="12" sm="6">
          <v-card
            class="py-4"
            color="pink-lighten-1"
            href="/sudoku"
            prepend-icon="mdi-grid"
            rel="noopener noreferrer"
            rounded="lg"
            target="_self"
            title="Sudoku" />
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            class="py-4"
            color="pink-lighten-1"
            href="/coop-minesweeper"
            prepend-icon="mdi-grid"
            rel="noopener noreferrer"
            rounded="lg"
            target="_self"
            max-width="100%"
            title="Minesweeper" />
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script setup lang="ts">
  //
</script>
