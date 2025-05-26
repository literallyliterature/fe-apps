<template>
  <div :key="minesKey">
    <v-app-bar
      color="#1d1d1d"
      floating>
        <v-row align="center" dense>
          <v-col cols="auto">
            <router-link to="/">
              <img class="pl-4" src="@/assets/logo.png" alt="Logo" style="width: 42px; height: auto;" />
            </router-link>
          </v-col>

          <v-spacer />

          <v-col cols="auto">
            <v-btn icon size="small" @click="refresh">
              <v-icon size="small">fa-solid fa-repeat</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="auto" class="text-body-2 mr-2">
              {{ remainingMines }} <span style="color: grey">remaining</span>
          </v-col>

          <v-col cols="auto">
              <v-switch
              class="mb-n5"
              v-model="mobileMode">
              <template #label>
                  <v-icon>
                  fa-solid fa-mobile-alt
                  </v-icon>
              </template>
              </v-switch>
          </v-col>
        </v-row>
    </v-app-bar>

    <div style="overflow: auto; zoom: 67%">
      <Minesweeper
        ref="mines"
        :key="minesKey"
        :mobile-mode="mobileMode"
        :number-of-cols="numberOfCols"
        :number-of-mines="numberOfMines"
        :number-of-rows="numberOfRows"
        @game-lost="showSnackbar(false)"
        @game-won="showSnackbar(true)"
        @update:flagged-cells="fc => flaggedCells = fc" />
    </div>

    <v-snackbar
      v-model="showingSnackbar"
      :color="snackbarColour"
      location="top"
    >
      {{ snackbarText }}

      <template
        v-if="showingRefreshInSnackbar"
        #actions>
        <v-btn
          icon
          @click="refresh">
          <v-icon>
            fa-solid fa-sync-alt
          </v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import Minesweeper from './Minesweeper.vue';

export default {
  name: 'App',
  components: {
    Minesweeper,
  },
  data() {
    return {
      flaggedCells: 0,
      minesKey: 0,
      mobileMode: false,
      numberOfCols: 30,
      numberOfRows: 16,
      numberOfMines: 99,
      showingRefreshInSnackbar: false,
      showingSnackbar: false,
      snackbarColour: 'error',
      snackbarText: '',
    };
  },
  computed: {
    remainingMines() {
      return (this.numberOfMines || 0) - (this.flaggedCells || 0);
    },
  },
  watch: {
    minesKey() {
      this.flaggedCells = 0;
      this.showingSnackbar = false;
    },
  },
  methods: {
    copyToClipboard(containerid) {
      if (document.selection) {
        const range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select().createTextRange();
        document.execCommand('copy');
      } else if (window.getSelection) {
        const range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().addRange(range);
        document.execCommand('copy');
      }
    },
    refresh() {
        this.minesKey += 1;
    },
    async showSnackbar(won = true) {
      const wait = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const minesKeyAtStartOfFn = this.minesKey;

      if (won) {
        this.showingRefreshInSnackbar = true;
        this.snackbarColour = 'success';
        this.snackbarText = 'Woot woot!';
        this.showingSnackbar = true;
      } else {
        this.snackbarColour = 'error darken-2';
        this.snackbarText = 'Oh no!';
        this.showingRefreshInSnackbar = false;
        this.showingSnackbar = true;
        await wait(2500);
        this.showingSnackbar = false;

        await wait(500);
        this.snackbarText = 'It\'s ok';
        this.showingRefreshInSnackbar = true;
        if (minesKeyAtStartOfFn === this.minesKey) this.showingSnackbar = true;
      }
    },
  },
};
</script>
