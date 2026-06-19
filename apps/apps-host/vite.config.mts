// Plugins
import Vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
// Utilities
import { defineConfig } from 'vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
    },
  },
  define: { 'process.env': {} },
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@minesweeper': fileURLToPath(new URL('../../libs/coop-minesweeper', import.meta.url)),
      '@note-taker': fileURLToPath(new URL('../../libs/note-taker', import.meta.url)),
      '@sudoku': fileURLToPath(new URL('../../libs/sudoku', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
});
