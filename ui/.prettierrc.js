module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  // Following options were added due to prettier searching recursively for .editorconfig files.
  // This means, that these configuration files can overwrite the default behaviour of prettier without notice.
  // For more see https://prettier.io/docs/en/api.html#prettierresolveconfigfilepath--options
  useTabs: false,
  tabWidth: 2,
  printWidth: 80,
  endOfLine: 'lf',
};
