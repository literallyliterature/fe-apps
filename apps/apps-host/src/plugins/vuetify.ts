/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@fortawesome/fontawesome-free/css/all.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import colors from 'vuetify/util/colors'
import { aliases, fa } from 'vuetify/iconsets/fa'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: { fa },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: colors.pink.lighten1,
          secondary: '#E93E1E',
          accent: '#1E63E9',
          background: colors.pink.lighten5
        }
      }
    }
  },
})
