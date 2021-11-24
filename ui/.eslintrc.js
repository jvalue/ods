module.exports = {
  extends: '@jvalue/eslint-config-jvalue/vue',
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          [
            'monaco-editor',
            './node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts',
          ],
        ],
        extensions: ['.js', '.ts', '.vue'],
      },
    },
  },
};
