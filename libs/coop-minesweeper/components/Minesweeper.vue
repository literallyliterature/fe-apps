<template>
  <div style="touch-action: manipulation">
    <v-row
      class="justify-center"
      no-gutters
      style="min-width: fit-content"
    >
      <v-col
        cols="auto"
        style="border:1px solid grey;"
      >
        <v-row
          v-for="(row, rowIndex) in blocks"
          :key="`row-${rowIndex}`"
          class="flex-nowrap"
          no-gutters
        >
          <v-col
            v-for="(cell, colIndex) in row"
            :key="`row-${rowIndex}-col-${colIndex}`"
            cols="auto"
          >
            <v-hover>
              <template #default="{ isHovering }">
                <v-btn
                  class="px-0 text-body-large font-weight-bold"
                  theme="dark"
                  :disabled="(messedUp && !cell.isMine)"
                  variant="plain"
                  tile
                  style="box-sizing:border-box; border: 1px solid #272727; color: #b8b8b8; width: 64px; height: 64px;"
                  :style="{
                    'background-color': isHovering && !cell.isVisible && !cell.isFlagged
                      ? '#555'
                      : getColour(rowIndex, colIndex),
                  }"
                  @mouseover="sendHoverData(rowIndex, colIndex)"
                  @click.left.prevent.stop="() => mobileMode
                    ? (cell.isVisible
                      ? middleClick(rowIndex, colIndex)
                      : rightClick(rowIndex, colIndex))
                    : leftClick(rowIndex, colIndex)"
                  @click.middle.prevent.stop="middleClick(rowIndex, colIndex)"
                  @contextmenu.prevent.stop="() => mobileMode
                    ? leftClick(rowIndex, colIndex)
                    : rightClick(rowIndex, colIndex)"
                >
                  <span v-if="cell.isFlagged || isGameWon">
                    <v-icon
                      size="large"
                      color="green"
                    >
                      fa-solid fa-flag
                    </v-icon>
                  </span>
                  <span v-else-if="messedUp && cell.isMine">
                    <v-icon
                      size="large"
                      color="error"
                    >
                      fa-solid fa-bomb
                    </v-icon>
                  </span>
                  <span v-else-if="(cell.isVisible && cell.surrounding !== 0)">
                    {{ cell.surrounding }}
                  </span>
                  <span v-else>&nbsp;</span>
                </v-btn>
              </template>
            </v-hover>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script>
function getRandomInt(max, min = 0) {
  const intmin = Math.ceil(min);
  const intmax = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (intmax - intmin) + intmin);
}

export default {
  computed: {
    flattenedBlocks() {
      return this.blocks.reduce((acc, row) => [
        ...acc,
        ...row,
      ], []);
    },
    isGameWon() {
      return !this.messedUp && this.flattenedBlocks
        .filter(b => !b.isVisible)
        .length === this.numberOfMines;
    },
  },

  created() {
    this.blocks = Array.from(
      { length: this.numberOfRows },
      () => Array.from({ length: this.numberOfCols }, () => ({})),
    );
  },
  data: () => ({
    blocks: [],
    connHoverCol: -1,
    connHoverRow: -1,
    messedUp: false,
    numberOfFlaggedCells: 0,
    preventHoverEmit: false,
    zeroClicks: true,
  }),
  methods: {
    getAdjacentCells(row, col) {
      const surroundingCells = [];

      for (const [r, c] of [ // eslint-disable-
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ]) {
        if (
          (r !== -1)
          && (c !== -1)
          && (r !== this.numberOfRows)
          && (c !== this.numberOfCols)
          && (r !== row || c !== col)
        ) {
          surroundingCells.push([r, c]);
        }
      }

      return surroundingCells;
    },
    getColour(row, col) {
      if (this.messedUp)
        return 'error darken-2';
      if (this.connHoverRow === row && this.connHoverCol === col)
        return '#363683';
      if (this.blocks[row][col].isVisible)
        return '#363636';
      return '#222';
    },
    getSurroundingCells(row, col) {
      const surroundingCells = [];

      for (const rd of [-1, 0, 1]) {
        for (const cd of [-1, 0, 1]) {
          const r = row + rd;
          const c = col + cd;

          if (
            (r !== -1)
            && (c !== -1)
            && (r !== this.numberOfRows)
            && (c !== this.numberOfCols)
            && (r !== row || c !== col)
          ) {
            surroundingCells.push([r, c]);
          }
        }
      }

      return surroundingCells;
    },
    getText(cell) {
      return cell.isVisible ? cell.surrounding : '-';
    },
    hasZeroSurrounding(row, col) {
      const cellsInRow = this.blocks[row] || [];
      const cell = cellsInRow[col] || {};
      return cell.surrounding === 0;
    },
    initialiseBlocks() {
      Array.from({ length: this.numberOfMines }).fill(null).forEach(() => this.markRandomBlockAsMine());

      for (let row = 0; row < this.numberOfRows; row += 1) {
        for (let col = 0; col < this.numberOfCols; col += 1) {
          this.setNumberOfSurroundingMines(row, col);
        }
      }

      this.$emit('send', {
        action: 'init-blocks',
        blocks: this.blocks,
      });
    },
    leftClick(row, col, doNotEmit = false) {
      if (this.messedUp)
        return;

      if (this.zeroClicks) {
        const surroundingBlocks = this.getSurroundingCells(row, col);
        surroundingBlocks.forEach(([r, c]) => {
          this.preventMinesOnSurroundingBlocks(r, c);
        });
        this.initialiseBlocks();

        this.zeroClicks = false;
      }

      if (!doNotEmit) {
        this.$emit('send', {
          action: 'left-click',
          col,
          row,
        });
      }

      const cell = this.blocks[row][col];
      if (cell.isFlagged || cell.isVisible)
        return;

      this.blocks[row][col].isVisible = true;

      if (cell.isMine) {
        this.messedUp = true;
      } else if (cell.surrounding === 0) {
        const surroundingCells = this.getSurroundingCells(row, col);
        surroundingCells.forEach(([r, c]) => {
          const z = this.hasZeroSurrounding;
          if (
            !!z
            || ((z(r, c - 1) || z(r, c + 1))
              && (z(r - 1, c) || z(r + 1, c)))
          ) {
            this.leftClick(r, c, true);
          }
        });
      }
    },
    markRandomBlockAsMine() {
      const randomCol = getRandomInt(this.numberOfCols);
      const randomRow = getRandomInt(this.numberOfRows);

      if (this.blocks[randomRow][randomCol].isMine || this.blocks[randomRow][randomCol].preventMine) {
        this.markRandomBlockAsMine();
      } else {
        this.blocks[randomRow][randomCol].isMine = true;
      }
    },
    middleClick(row, col, doNotEmit) {
      const cell = this.blocks[row][col];
      const surroundingBlocks = this.getSurroundingCells(row, col);
      const numberOfSurroundingFlags = surroundingBlocks.filter(([r, c]) => this.blocks[r][c].isFlagged).length;
      if (numberOfSurroundingFlags >= cell.surrounding)
        surroundingBlocks.forEach(([r, c]) => this.leftClick(r, c, true));
      if (!doNotEmit) {
        this.$emit('send', {
          action: 'middle-click',
          col,
          row,
        });
      }
    },
    preventMinesOnSurroundingBlocks(row, col) {
      const surroundingBlocks = this.getSurroundingCells(row, col);
      this.blocks[row][col].preventMine = true;
      surroundingBlocks.forEach(([r, c]) => {
        this.blocks[r][c].preventMine = true;
      });
    },
    rightClick(row, col, doNotEmit = false) {
      const cell = this.blocks[row][col];
      if (this.blocks[row][col].isVisible)
        return;

      const wasFlagged = cell.isFlagged;
      cell.isFlagged = !wasFlagged;
      this.numberOfFlaggedCells += wasFlagged ? -1 : 1;

      this.$emit('update:flaggedCells', this.numberOfFlaggedCells);

      if (!doNotEmit) {
        this.$emit('send', {
          action: 'right-click',
          col,
          row,
        });
      }
    },
    sendHoverData(row, col) {
      if (this.preventHoverEmit)
        return;

      this.$emit('send', {
        action: 'hover',
        col,
        row,
      });

      this.preventHoverEmit = true;
      setTimeout(() => {
        this.preventHoverEmit = false;
      }, 100);
    },
    setBlocks(blocks) {
      this.zeroClicks = false;
      this.blocks = blocks;
    },
    setConnHover(row, col) {
      this.connHoverRow = row;
      this.connHoverCol = col;
    },
    setNumberOfSurroundingMines(row, col) {
      if (this.blocks[row][col].isMine)
        return;

      const cellsToCheck = this.getSurroundingCells(row, col);
      const cellsWithMines = cellsToCheck.filter(([r, c]) => !!this.blocks[r][c].isMine);

      this.blocks[row][col].surrounding = cellsWithMines.length;
    },
  },

  props: {
    mobileMode: {
      default: false,
      type: Boolean,
    },
    numberOfCols: {
      default: 30,
      type: Number,
    },
    numberOfMines: {
      default: 99,
      type: Number,
    },
    numberOfRows: {
      default: 16,
      type: Number,
    },
  },

  watch: {
    isGameWon(val) {
      if (val)
        this.$emit('gameWon');
    },
    messedUp(val) {
      if (val)
        this.$emit('gameLost');
    },
  },
};
</script>
