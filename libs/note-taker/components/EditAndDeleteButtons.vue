<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-row
        class="align-center"
        v-bind="props"
        no-gutters
        :style="isHovering ? 'opacity: 1' : `opacity: ${defaultOpacity}`"
      >
        <v-col @click="$emit('click')">
          <div :style="!noClickListener ? 'cursor: pointer' : ''">
            <slot />
          </div>
        </v-col>

        <v-col
          cols="auto"
          style="transition: opacity 0.1s"
          :style="!isHovering ? 'opacity: 0' : ''"
        >
          <v-btn
            v-if="showDeleteItems"
            class="ml-1"
            icon
            size="x-small"
            variant="text"
            @click="$emit('deleteItems')"
          >
            <v-icon size="small">
              fa-solid fa-list-check
            </v-icon>
          </v-btn>

          <v-btn
            class="ml-1"
            icon
            size="x-small"
            variant="text"
            @click="$emit('edit')"
          >
            <v-icon size="small">
              fa-solid fa-pencil-alt
            </v-icon>
          </v-btn>

          <v-btn
            icon
            size="x-small"
            variant="text"
            @click="$emit('delete')"
          >
            <v-icon size="small">
              fa-solid fa-trash
            </v-icon>
          </v-btn>
        </v-col>

        <v-col cols="auto">
          <v-tooltip
            v-if="tooltipText"
            location="top"
            :text="tooltipText"
          >
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                class="ml-2"
                icon="fa-solid fa-clock"
                size="x-small" />
            </template>
          </v-tooltip>
        </v-col>
      </v-row>
    </template>
  </v-hover>
</template>

<script lang="ts" setup>
const {
  defaultOpacity = '0.8',
  noClickListener = false,
  showDeleteItems = false,
} = defineProps<{
  defaultOpacity?: string;
  noClickListener?: boolean;
  showDeleteItems?: boolean;
  tooltipText?: string;
}>();
defineEmits(['click', 'edit', 'delete', 'deleteItems']);
</script>
