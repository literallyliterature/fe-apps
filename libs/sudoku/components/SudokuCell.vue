<script lang="ts">
import { computed, defineComponent, useTemplateRef } from 'vue';

export default defineComponent({
  name: 'SudokuCell',
  emits: ['focused', 'keyPressed'],
  props: {
    cell: {
      required: true,
      type: Object,
    },
    isFocused: {
      default: false,
      type: Boolean,
    },
    isGameComplete: {
      default: false,
      type: Boolean,
    },
    mistake: {
      default: false,
      type: Boolean,
    },
  },
  setup(props, { emit }) {
    const cellDiv = useTemplateRef<HTMLDivElement>('cellDiv');

    const focus = () => cellDiv.value?.focus();

    const backgroundColour = computed(() => {
      if (props.isGameComplete) {
        return props.cell.original === ' ' ? '#475247' : '#343d34';
      }
      if (readonly.value) {
        return props.isFocused ? '#34345f' : '#343434';
      }
      return props.isFocused ? '#48486f' : '#474747';
    });

    const displayedNotes = computed(() => {
      return Object.keys(props.cell.notedNumbers)
        .filter(key => props.cell.notedNumbers[key])
        .join(' ');
    });

    const readonly = computed(() => {
      return props.isGameComplete || props.cell.original !== ' ';
    });

    const handleFocus = () => {
      emit('focused', { col: props.cell.column, row: props.cell.row });
    };

    const handleKeydown = (event: KeyboardEvent) => {
      emit('keyPressed', event);
    };

    return {
      backgroundColour,
      cellDiv,
      displayedNotes,
      focus,
      handleFocus,
      handleKeydown,
      readonly,
    };
  },
});
</script>

<template>
  <div
    ref="cellDiv"
    class="sudoku-cell d-flex"
    tabindex="0"
    :readonly="readonly"
    style="font-size: 11px"
    :style="{ background: backgroundColour }"
    @focus="handleFocus"
    @keydown.prevent="handleKeydown"
  >
    <div
      v-if="cell.original !== ' '"
      style="color: #cacaca; font-size: 20px"
      v-text="cell.correctValue"
    />
    <div
      v-else-if="cell.userInput !== ' '"
      style="font-size: 20px"
      :style="mistake ? 'color: #ff3a00' : 'color: #dadada'"
      v-text="cell.userInput"
    />
    <div
      v-else
      class="font-weight-bold"
      style="max-width: 35px; font-size: 9px; color: #c2c2c2"
      v-text="displayedNotes"
    />
  </div>
</template>

<style>
.sudoku-cell {
  border: 1px solid rgba(0, 0, 0, 0.15);
  width: 36px;
  height: 36px;
  justify-content: center;
  touch-action: manipulation;
  align-content: center;
  align-items: center;
  caret-color: transparent;
}
.sudoku-cell:focus {
  outline: none !important;
}
</style>
