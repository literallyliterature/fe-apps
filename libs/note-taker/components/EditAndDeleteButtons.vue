<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-row v-bind="props" align="center" no-gutters :style="isHovering ? 'opacity: 1' : 'opacity: 0.8'">
        <v-col>
          <slot />
        </v-col>

        <v-col
          cols="auto"
          style="transition: opacity 0.2s ease-in-out"
          :style="!isHovering ? 'opacity: 0' : ''">
          <v-btn class="ml-1" icon size="x-small" variant="text" @click="$emit('edit')">
            <v-icon size="small">fa-solid fa-pencil-alt</v-icon>
          </v-btn>
          
          <v-btn icon size="x-small" variant="text" @click="$emit('delete')">
            <v-icon size="small">fa-solid fa-trash</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </template>
  </v-hover>
</template>

<script lang="ts" setup>
defineEmits(['edit', 'delete']);
</script>
