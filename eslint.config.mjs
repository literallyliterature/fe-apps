import antfu from '@antfu/eslint-config';
import perfectionist from 'eslint-plugin-perfectionist';
import vuetify from 'eslint-plugin-vuetify';

export default antfu(
  {
    // using rules directly instead of the whole plugin because antfu configures the plugin
    rules: perfectionist.configs['recommended-natural'].rules,
  },
  ...vuetify.configs['flat/recommended-v4'],
  {
    rules: {
      'antfu/if-newline': ['off'],
      'no-restricted-imports': ['error', {
        paths: [
          {
            importNames: ['default'],
            message: 'Directly import the required functions from lodash-es so that the entire library is not included in build',
            name: 'lodash-es',
          },
          {
            importNames: ['chain'],
            message: 'Using chain leads to additional unnecessary imports and worse tree-shaking. Refactor to avoid using it',
            name: 'lodash-es',
          },
          {
            importNames: ['orderBy'],
            message: 'Use natural-orderby instead',
            name: 'lodash-es',
          },
          {
            importNames: ['default', 'z'],
            message: 'Avoid directly importing zod and only import required functionality to support tree-shaking',
            name: 'zod',
          },
        ],
      }],
      'no-shadow': ['error'],
      'no-unreachable': ['error'],
      'node/prefer-global/process': ['error', 'always'],
      'perfectionist/sort-array-includes': ['error', {
        partitionByNewLine: true,
        type: 'natural',
      }],
      'style/brace-style': ['error', '1tbs'],
      'style/function-call-spacing': ['error'],
      'style/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      }],
      'style/no-extra-semi': ['error'],
      'style/object-curly-newline': ['error', {
        ExportDeclaration: {
          minProperties: 3,
          multiline: true,
        },
        ImportDeclaration: {
          minProperties: 3,
          multiline: true,
        },
      }],
      'style/semi': ['error', 'always'],
      'test/prefer-lowercase-title': ['off'],
      'vue/block-order': ['error', {
        order: ['template', 'script', 'style'],
      }],
      'vue/component-api-style': ['error', ['script-setup', 'composition']],
      'vue/define-props-declaration': ['error'],
      'vue/html-closing-bracket-newline': [
        'error',
        {
          multiline: 'always',
          selfClosingTag: {
            multiline: 'never',
            singleline: 'never',
          },
          singleline: 'never',
        },
      ],
      'vue/max-attributes-per-line': ['error', {
        multiline: { max: 1 },
        singleline: { max: 1 },
      }],
      'vue/no-bare-strings-in-template': ['error', {
        attributes: {
          '/.+/': ['label', 'placeholder', 'text', 'title', 'validation-field-name'],
        },
      }],
      'vue/no-ref-as-operand': ['error'],
      'vue/no-undef-components': ['error', {
        ignorePatterns: [
          '^v-*',
          'router-link$',
          'router-view$',
        ],
      }],
      'vue/no-unused-properties': ['error'],
    },
  },
  {
    files: ['**/*.routes.ts', '**/*.stories.ts'],
    rules: {
      'perfectionist/sort-objects': [
        'error',
        {
          customGroups: [
            {
              elementNamePattern: '^(?:path|name|component)$',
              groupName: 'top',
              selector: 'property',
            },
            {
              elementNamePattern: '^(?:children|args)$',
              groupName: 'bottom',
              selector: 'property',
            },
          ],
          groups: [
            'top',
            'unknown',
            ['multiline-member', 'bottom'],
          ],
          type: 'natural',
        },
      ],
    },
  },
);
