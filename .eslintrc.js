module.exports = {
  extends: ['ecubelabs', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018, // es9
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.ts'],
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  plugins: ['import', 'prettier'],
  rules: {
    'import/extensions': [2, 'ignorePackages'], // 이게 없으면 resolve가 안된다.
    'import/prefer-default-export': 0,
    'no-unused-vars': 0,
    'max-classes-per-file': 0,
    'import/order': 0, // TODO: import 와 require 를 섞어서 쓰면 이 룰에 걸린다. 어떻게 해야 하나...
    'prettier/prettier': 'error',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      /**
       * use root tsconfig.json
       * @see https://github.com/alexgorbatchev/eslint-import-resolver-typescript
       */
      typescript: {},
      node: {
        extensions: ['.ts'],
      },
    },
  },
};
