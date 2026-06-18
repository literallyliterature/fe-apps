import antfu from '@antfu/eslint-config';

export default antfu({
  rules: {
    'no-alert': ['off'],
    'style/semi': ['error', 'always'],
  },
});
