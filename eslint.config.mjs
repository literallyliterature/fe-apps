import antfu from '@antfu/eslint-config';
import perfectionist from 'eslint-plugin-perfectionist';

export default antfu(
  {
    rules: perfectionist.configs['recommended-natural'].rules,
  },
  {
    rules: {
      'antfu/if-newline': ['off'],
      'no-alert': ['off'],
      'style/brace-style': ['error', '1tbs'],
      'style/semi': ['error', 'always'],
    },
  },
);
