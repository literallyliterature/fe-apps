<template>
  <v-container class="fill-height" fluid style="max-width: 100%">
    <v-row>
      <v-col cols="4" style="border-right: 1px solid grey">
        <v-row align="center">
          <v-col>
            <v-autocomplete
              v-model="selectedItem"
              v-model:search="searchString"
              autocomplete="off"
              autofocus
              auto-select-first
              hide-details
              hide-no-data
              :items
              item-title="title"
              label="Input"
              no-filter
              return-object
              style="max-width: 600px"
              variant="outlined" />
            </v-col>
        </v-row>
      </v-col>

      <v-col cols="4" style="border-right: 1px solid grey">
        <div style="display: grid; grid: auto / 1fr 1fr">
          <div>
            <!-- Sections -->
            <div
              v-for="section in grid.sections"
              :style="section === grid.selectedSection ? 'font-weight: bold' : ''">
              {{ section.title }}
            </div>
          </div>

          <div>
            <div
              v-for="page in grid.pages"
              :style="page === grid.selectedPage ? 'font-weight: bold' : ''">
              {{ page.title }}
            </div>
          </div>
        </div>
      </v-col>

      <v-col cols="4">
        <div>
          <!-- style="display: grid; grid: auto / 1fr 1fr; gap: 8px"> -->
          <div v-for="context in grid.contexts" class="mb-8">
            <div
              class="mb-2"
              :style="context === grid.selectedContext ? 'font-weight: bold' : ''">
              {{ context.title }}
            </div>

            <div>
              <div v-if="context.type === 'todo'">
                <v-checkbox
                  v-for="item in context.items"
                  v-model="item.done"
                  class="mt-n2"
                  density="compact"
                  hide-details
                  :label="item.title" />
              </div>
              <ul v-else-if="context.type === 'unordered-list'" style="list-style-position: inside;">
                <li v-for="item in context.items">
                  {{ item.title }}
                </li>
              </ul>
              <ol v-else-if="context.type === 'ordered-list'" style="list-style-position: inside;">
                <li v-for="item in context.items">
                  {{ item.title }}
                </li>
              </ol>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NoteTaker } from '../data/NoteTaker';
import { type SearchItem } from '../data/NoteTaker.types';

const selectedItem = ref(null);
const noteTaker = ref(new NoteTaker());

const grid = computed(() => {
  const { allSections, selectedSection, selectedPage, selectedContext } = noteTaker.value;
  return {
    sections: allSections,
    selectedSection,

    pages: selectedSection?.pages || [],
    selectedPage,

    contexts: selectedPage?.contexts || [],
    selectedContext,
  };
});

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
