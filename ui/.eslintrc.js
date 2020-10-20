const standardWithTsConfig = require('eslint-config-standard-with-typescript');

// By default the rules from standard-with-typescript are only applied on *.ts and *.tsx files.
// Therefore, we extract all the rules and apply them manually below.
const typeScriptRules = {
  ...standardWithTsConfig.overrides[0].rules,
  // Additional rules or changes
  '@typescript-eslint/ban-types': ['error', {
    types: {
      // By default type `object` is banned because of https://github.com/microsoft/TypeScript/issues/21732.
      // This issue is not really effecting us and we use `object` heavily, therefore `object` is allowed.
      object: false
    }
  }],
  '@typescript-eslint/restrict-template-expressions': ['error', {
    allowNumber: true, allowAny: true, allowBoolean: true
  }]
}

module.exports = {
  env: {
    browser: true,
    es6: true
  },
  rules: {
    'max-len': ['error', 120, 4, { ignoreUrls: true }],
  },
  overrides: [
    {
      files: ['*.vue'],
      extends: [
        'plugin:vue/recommended',
        '@vue/typescript'
      ],
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        ...typeScriptRules,
        // Disable the following rules because they do not work correctly in .vue files
        '@typescript-eslint/prefer-readonly': 'off',
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: 'standard-with-typescript',
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: typeScriptRules
    }
  ]
}
