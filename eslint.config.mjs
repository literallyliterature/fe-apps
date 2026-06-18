import antfu from '@antfu/eslint-config';

export default antfu({
  rules: {
    'antfu/if-newline': ['off'],
    'no-alert': ['off'],
    'style/semi': ['error', 'always'],
  },
});
