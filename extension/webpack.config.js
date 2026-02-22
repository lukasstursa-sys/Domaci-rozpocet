const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    newtab: './src/newtab.tsx',
    popup: './src/popup.tsx',
    background: './src/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/newtab.html',
      filename: 'newtab.html',
      chunks: ['newtab'],
    }),
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
        { from: 'public/pwa-manifest.json', to: 'pwa-manifest.json' },
        { from: 'public/sw.js', to: 'sw.js' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  devtool: process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',
  optimization: {
    splitChunks: false,
  },
};
