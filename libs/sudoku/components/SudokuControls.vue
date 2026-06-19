<script lang="ts">
import { defineComponent } from 'vue';

interface IconAndAction {
  actionStr: string
  icon: string
}

export default defineComponent({
  name: 'SudokuControls',
  props: {
    disableUndoButton: {
      default: false,
      type: Boolean,
    },
    inNotesMode: {
      default: false,
      type: Boolean,
    },
  },
  setup(props, { emit }) {
    const numItems: IconAndAction[] = [
      { actionStr: '1', icon: 'fas fa-1' },
      { actionStr: '2', icon: 'fas fa-2' },
      { actionStr: '3', icon: 'fas fa-3' },
      { actionStr: '4', icon: 'fas fa-4' },
      { actionStr: '5', icon: 'fas fa-5' },
      { actionStr: '6', icon: 'fas fa-6' },
      { actionStr: '7', icon: 'fas fa-7' },
      { actionStr: '8', icon: 'fas fa-8' },
      { actionStr: '9', icon: 'fas fa-9' },
    ];

    const emitAction = (actionStr: string) => {
      emit('action', actionStr);
    };

    return {
      emitAction,
      numItems,
    };
  },
});
</script>

<template>
  <v-row align="center" align-content="center" dense justify="space-around">
    <v-col cols="auto" style="max-width: 50px">
      <v-row justify="center" dense>
        <v-col>
          <v-btn
            :color="inNotesMode ? 'accent' : 'primary'"
            icon
            @click="$emit('update:in-notes-mode', !inNotesMode)"
          >
            <v-icon>fas fa-pencil-alt</v-icon>
          </v-btn>
        </v-col>

        <v-col>
          <v-btn icon color="primary" @click="emitAction('del')">
            <v-icon>fas fa-trash-alt</v-icon>
          </v-btn>
        </v-col>

        <v-col>
          <v-btn
            :disabled="disableUndoButton"
            icon
            color="primary"
            @click="$emit('undo')"
          >
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
          cols="4"
        >
          <v-btn icon variant="outlined" color="primary" @click="emitAction(numItem.actionStr)">
            <v-icon>{{ numItem.icon }}</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
