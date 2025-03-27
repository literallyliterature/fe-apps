<template>
  <div
    ref="cellDiv"
    class="sudoku-cell d-flex"
    tabindex="0"
    :readonly="readonly"
    style="font-size: 11px"
    :style="{ background: backgroundColour }"
    @focus="handleFocus"
    @keydown.prevent="handleKeydown">
    <div
      v-if="cell.original !== ' '"
      style="color: #cacaca; font-size: 20px"
      v-text="cell.correctValue" />
    <div
      v-else-if="cell.userInput !== ' '"
      style="font-size: 20px"
      :style="mistake ? 'color: #ff3a00' : 'color: #dadada'"
      v-text="cell.userInput" />
    <div
      v-else
      class="font-weight-bold"
      style="max-width: 35px; font-size: 9px; color: #c2c2c2"
      v-text="displayedNotes" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, useTemplateRef } from 'vue';

export default defineComponent({
  name: 'SudokuCell',
  props: {
    cell: {
      type: Object,
      required: true,
    },
    isFocused: {
      type: Boolean,
      default: false,
    },
    isGameComplete: {
      type: Boolean,
      default: false,
    },
    mistake: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['focused', 'keyPressed'],
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
        .filter((key) => props.cell.notedNumbers[key])
        .join(' ');
    });

    const readonly = computed(() => {
      return props.isGameComplete || props.cell.original !== ' ';
    });

    const handleFocus = () => {
      emit('focused', { row: props.cell.row, col: props.cell.column });
    };

    const handleKeydown = (event: KeyboardEvent) => {
      emit('keyPressed', event);
    };

    return {
      cellDiv,
      focus,
      backgroundColour,
      displayedNotes,
      readonly,
      handleFocus,
      handleKeydown,
    };
  },
});
</script>

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
