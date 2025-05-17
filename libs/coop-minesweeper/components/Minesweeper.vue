<template>
    <div style="touch-action: manipulation">
        <v-row
        justify="center"
        no-gutters
        style="min-width: fit-content">
        <v-col
            cols="auto"
            style="border:1px solid grey;">
            <v-row
            v-for="(row, rowIndex) in blocks"
            :key="`row-${rowIndex}`"
            class="flex-nowrap"
            no-gutters>
            <v-col
                v-for="(cell, colIndex) in row"
                :key="`row-${rowIndex}-col-${colIndex}`"
                cols="auto">
                <v-hover>
                <template #default="{ isHovering }">
                    <v-btn
                    @mouseover="sendHoverData(rowIndex, colIndex)"
                    class="px-0 text-body-1 font-weight-bold"
                    dark
                    :disabled="(messedUp && !cell.isMine)"
                    variant="plain"
                    tile
                    style="box-sizing:border-box; border: 1px solid #272727; color: #b8b8b8; width: 64px; height: 64px;"
                    :style="{
                        'background-color': isHovering && !cell.isVisible && !cell.isFlagged ?
                        '#555' :
                        getColour(rowIndex, colIndex),
                    }"
                    @click.left.prevent.stop="() => mobileMode ?
                        (cell.isVisible ?
                        middleClick(rowIndex, colIndex) :
                        rightClick(rowIndex, colIndex)) :
                        leftClick(rowIndex, colIndex)"
                    @click.middle.prevent.stop="middleClick(rowIndex, colIndex)"
                    @contextmenu.prevent.stop="() => mobileMode ?
                        leftClick(rowIndex, colIndex) :
                        rightClick(rowIndex, colIndex)">

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
/* eslint-disable max-len */

function getRandomInt(max, min = 0) {
const intmin = Math.ceil(min);
const intmax = Math.floor(max);
// The maximum is exclusive and the minimum is inclusive
return Math.floor(Math.random() * (intmax - intmin) + intmin);
}

export default {
props: {
    mobileMode: {
    type: Boolean,
    default: false,
    },
    numberOfCols: {
    type: Number,
    default: 30,
    },
    numberOfMines: {
    type: Number,
    default: 99,
    },
    numberOfRows: {
    type: Number,
    default: 16,
    },
},

data: () => ({
    blocks: [],
    connHoverRow: -1,
    connHoverCol: -1,
    numberOfFlaggedCells: 0,
    preventHoverEmit: false,
    messedUp: false,
    zeroClicks: true,
}),

computed: {
    flattenedBlocks() {
    return this.blocks.reduce((acc, row) => [
        ...acc,
        ...row,
    ], []);
    },
    isGameWon() {
    return !this.messedUp && this.flattenedBlocks
        .filter((b) => !b.isVisible)
        .length === this.numberOfMines;
    },
},

watch: {
    isGameWon(val) {
    if (val) this.$emit('game-won');
    },
    messedUp(val) {
    if (val) this.$emit('game-lost');
    },
},

created() {
    this.blocks = Array.from(
    { length: this.numberOfRows },
    () => Array.from({ length: this.numberOfCols }, () => ({})),
    );
},

methods: {
    getColour(row, col) {
    if (this.messedUp) return 'error darken-2';
    if (this.connHoverRow === row && this.connHoverCol === col) return '#363683';
    if (this.blocks[row][col].isVisible) return '#363636';
    return '#222';
    },
    getText(cell) {
    return cell.isVisible ? cell.surrounding : '-';
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
    initialiseBlocks() {
    const vm = this;

    Array.from({ length: this.numberOfMines }, () => null).forEach(() => vm.markRandomBlockAsMine());

    for (let row = 0; row < this.numberOfRows; row += 1) {
        for (let col = 0; col < this.numberOfCols; col += 1) {
        vm.setNumberOfSurroundingMines(row, col);
        }
    }

    this.$emit('send', {
        action: 'init-blocks',
        blocks: this.blocks,
    });
    },
    setBlocks(blocks) {
    this.zeroClicks = false;
    this.blocks = blocks;
    },
    setConnHover(row, col) {
    this.connHoverRow = row;
    this.connHoverCol = col;
    },
    sendHoverData(row, col) {
    if (this.preventHoverEmit) return;

    this.$emit('send', {
        action: 'hover',
        col,
        row,
    });

    const vm = this;
    vm.preventHoverEmit = true;
    setTimeout(() => {
        vm.preventHoverEmit = false;
    }, 100);
    },
    leftClick(row, col, doNotEmit = false) {
    if (this.messedUp) return;
    const vm = this;

    if (this.zeroClicks) {
        const surroundingBlocks = this.getSurroundingCells(row, col);
        surroundingBlocks.forEach(([r, c]) => {
        vm.preventMinesOnSurroundingBlocks(r, c);
        });
        this.initialiseBlocks();

        this.zeroClicks = false;
    }

    if (!doNotEmit) {
        this.$emit('send', {
        action: 'left-click',
        row,
        col,
        });
    }

    const cell = this.blocks[row][col];
    if (cell.isFlagged || cell.isVisible) return;

    this.blocks[row][col].isVisible = true;

    if (cell.isMine) this.messedUp = true;
    else if (cell.surrounding === 0) {
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
    hasZeroSurrounding(row, col) {
    const cellsInRow = this.blocks[row] || [];
    const cell = cellsInRow[col] || {};
    return cell.surrounding === 0;
    },
    preventMinesOnSurroundingBlocks(row, col) {
    const vm = this;
    const surroundingBlocks = this.getSurroundingCells(row, col);
    vm.blocks[row][col].preventMine = true;
    surroundingBlocks.forEach(([r, c]) => {
        vm.blocks[r][c].preventMine = true;
    });
    },
    middleClick(row, col, doNotEmit) {
    const cell = this.blocks[row][col];
    const surroundingBlocks = this.getSurroundingCells(row, col);
    const numberOfSurroundingFlags = surroundingBlocks.filter(([r, c]) => this.blocks[r][c].isFlagged).length;
    if (numberOfSurroundingFlags >= cell.surrounding) surroundingBlocks.forEach(([r, c]) => this.leftClick(r, c, true));
    if (!doNotEmit) {
        this.$emit('send', {
        action: 'middle-click',
        row,
        col,
        });
    }
    },
    rightClick(row, col, doNotEmit = false) {
    const cell = this.blocks[row][col];
    if (this.blocks[row][col].isVisible) return;

    const wasFlagged = cell.isFlagged;
    cell.isFlagged = !wasFlagged;
    this.numberOfFlaggedCells += wasFlagged ? -1 : 1;

    this.$emit('update:flaggedCells', this.numberOfFlaggedCells);

    if (!doNotEmit) {
        this.$emit('send', {
        action: 'right-click',
        row,
        col,
        });
    }
    },
    getAdjacentCells(row, col) {
    const surroundingCells = [];

    for (const [r, c] of [ // eslint-disable-line
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
    getSurroundingCells(row, col) {
    const surroundingCells = [];

    for (const rd of [-1, 0, 1]) { // eslint-disable-line
        for (const cd of [-1, 0, 1]) { // eslint-disable-line
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
    setNumberOfSurroundingMines(row, col) {
    if (this.blocks[row][col].isMine) return;

    const cellsToCheck = this.getSurroundingCells(row, col);
    const cellsWithMines = cellsToCheck.filter(([r, c]) => !!this.blocks[r][c].isMine);

    this.blocks[row][col].surrounding = cellsWithMines.length;
    },
},
};
</script>
