<template>
  <v-container class="fill-height">
    <v-row>
      <v-col style="border-right: 1px solid grey">
        <v-autocomplete
          v-model="selectedItem"
          v-model:search="searchString"
          autocomplete="off"
          autofocus
          auto-select-first
          hide-no-data
          :items
          item-title="title"
          label="Input"
          no-filter
          return-object
          style="max-width: 600px"
          variant="outlined" />
      </v-col>

      <v-col>
        <pre>
          {{ stringified }}
        </pre>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NoteTaker } from '../data/NoteTaker';
import { SearchItem } from '../data/NoteTaker.types';

const selectedItem = ref(null);
const noteTaker = ref(new NoteTaker());
const stringified = computed(() => JSON.stringify(noteTaker.value.allSections, null, 2));

const items = ref<SearchItem[]>([]);
const searchString = ref('');

watch(selectedItem, (v) => {
  if (!v) return;
  noteTaker.value.onSelect(v);
  selectedItem.value = null;
  searchString.value = '';
});
watch(searchString, v => items.value = noteTaker.value.getSearchItems(v));
</script>
