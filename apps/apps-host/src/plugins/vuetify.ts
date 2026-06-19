/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify';
import { aliases, fa } from 'vuetify/iconsets/fa';
import colors from 'vuetify/util/colors';
// Styles
import '@fortawesome/fontawesome-free/css/all.css';
import 'vuetify/styles';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  icons: {
    aliases,
    defaultSet: 'fa',
    sets: { fa },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          accent: '#1E63E9',
          background: colors.pink.lighten5,
          primary: colors.pink.lighten1,
          secondary: '#E93E1E',
        },
      },
    },
  },
});
