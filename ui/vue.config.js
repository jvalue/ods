module.exports = {
  publicPath: './',
  configureWebpack: {
    devServer: {
      open: true,
      port: 8080
    },
    devtool: 'source-map'
  }
}
