<template>
  <v-row align="center" align-content="center" dense justify="space-around">
    <v-col cols="auto" style="max-width: 50px">
      <v-row justify="center" dense>
        <v-col>
          <v-btn
            @click="$emit('update:in-notes-mode', !inNotesMode)"
            :color="inNotesMode ? 'accent' : 'primary'"
            icon>
            <v-icon>fas fa-pencil-alt</v-icon>
          </v-btn>
        </v-col>

        <v-col>
          <v-btn @click="emitAction('del')" icon color="primary">
            <v-icon>fas fa-trash-alt</v-icon>
          </v-btn>
        </v-col>

        <v-col>
          <v-btn
            @click="$emit('undo')"
            :disabled="disableUndoButton"
            icon
            color="primary">
            <v-icon>fas fa-undo</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-col>

    <v-col cols="auto" style="max-width: 140px">
      <v-row dense justify="center">
        <v-col
          v-for="(numItem, index) in numItems"
          :key="index"
          cols="4">
          <v-btn @click="emitAction(numItem.actionStr)" icon variant="outlined" color="primary">
            <v-icon>{{ numItem.icon }}</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

interface IconAndAction {
  icon: string;
  actionStr: string;
}

export default defineComponent({
  name: 'SudokuControls',
  props: {
    inNotesMode: {
      type: Boolean,
      default: false,
    },
    disableUndoButton: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const numItems: IconAndAction[] = [
      { icon: 'fas fa-1', actionStr: '1' },
      { icon: 'fas fa-2', actionStr: '2' },
      { icon: 'fas fa-3', actionStr: '3' },
      { icon: 'fas fa-4', actionStr: '4' },
      { icon: 'fas fa-5', actionStr: '5' },
      { icon: 'fas fa-6', actionStr: '6' },
      { icon: 'fas fa-7', actionStr: '7' },
      { icon: 'fas fa-8', actionStr: '8' },
      { icon: 'fas fa-9', actionStr: '9' },
    ];

    const emitAction = (actionStr: string) => {
      emit('action', actionStr);
    };

    return {
      numItems,
      emitAction,
    };
  },
});
</script>
