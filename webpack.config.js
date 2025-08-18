const path = require('path')

module.exports = {
  entry: './src/scripts/index.js',
  output: {
    filename: 'custom.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'development',
  devtool: false, // Disable source maps for cleaner output
  optimization: {
    minimize: false, // Keep code readable for debugging
  },
  // Remove the module.rules section that was causing the babel-loader error
}
