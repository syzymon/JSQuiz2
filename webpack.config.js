const path = require('path');
module.exports = {
  mode: 'production',
  entry: './client/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        include: [
          path.resolve(__dirname, 'client'),
          path.resolve(__dirname, 'client/data'),
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public', 'javascripts'),
  },
};
