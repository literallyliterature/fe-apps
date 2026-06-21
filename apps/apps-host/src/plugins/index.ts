/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Types
import type { App } from 'vue';

import { createPinia } from 'pinia';

// Plugins
import vuetify from './vuetify';

const pinia = createPinia();

export function registerPlugins(app: App) {
  app.use(pinia);
  app.use(vuetify);
}
