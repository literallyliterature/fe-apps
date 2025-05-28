<template>
  <v-container class="fill-height" fluid style="max-width: 100%">
    <div class="page-grid">
      <div class="bottom-of-grid">
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
      </div>

      <v-container class="fill-height">
        <v-row justify="space-around" style="overflow-y: scroll">
          <v-col style="min-width: 200px">
            <!-- Sections -->
            <div class="text-overline">Sections</div>

            <div
              v-for="section in grid.sections"
              class="mb-1"
              :class="section === grid.selectedSection ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'">
              {{ section.title }}
            </div>
          </v-col>

          <v-col style="min-width: 200px">
            <div class="text-overline">Pages</div>

            <div
              v-for="page in grid.pages"
              class="mb-1"
              :class="page === grid.selectedPage ? 'font-weight-bold text-pink-lighten-1' : 'text-grey-darken-1'">
              {{ page.title }}
            </div>
          </v-col>
        </v-row>
      </v-container>

      <div style="overflow-y: scroll">
        <div style="display: grid; grid: auto / 1fr 1fr; gap: 16px">
          <div v-for="context in grid.contexts" class="mb-8">
            <v-card
              class="pa-3"
              :color="context === grid.selectedContext ? 'pink-lighten-1' : ''"
              variant="outlined">
              <div
                class="mb-2 font-weight-bold">
                {{ context.title }}
              </div>

              <div v-if="context.type === 'todo'">
                <v-checkbox
                  v-for="item in context.items"
                  v-model="item.done"
                  class="mt-n2"
                  density="comfortable"
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
            </v-card>
            </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NoteTaker } from '../data/NoteTaker';
import { type SearchItem } from '../data/NoteTaker.types';

const selectedItem = ref(null);

const storedJSON = localStorage.getItem('notes_json');
const parsedJSON = (() => {
  if (!storedJSON) return undefined;
  try {
    return JSON.parse(storedJSON);
  } catch {
    return undefined;
  }
})();

const noteTaker = ref(new NoteTaker(parsedJSON));

const allSections = computed(() => noteTaker.value.allSections);
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

watch(allSections, v => {
  setTimeout(() => {
    localStorage.setItem('notes_json', JSON.stringify(v));
  });
}, { deep: true });
</script>

<style>
.page-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid: auto auto / 1fr 2fr;
  gap: 32px;
  max-height: 90vh;
}

.bottom-of-grid {
  align-self: end;
  grid-column: 1 / 4;
  grid-row: 2;
  width: 100%;
  max-width: 600px;
  justify-self: center;
}
</style>
