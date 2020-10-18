module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'max-len': ['error', { code: 120, ignoreUrls: true }]
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
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
    }
  ]
}
