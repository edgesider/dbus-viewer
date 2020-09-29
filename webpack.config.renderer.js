const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const merge = require('./webpack.config.base')

module.exports = merge({
    target: 'electron-renderer',
    entry: ['./src/renderer/renderer.ts', './src/renderer/main.css'],
    output: {
        filename: 'renderer.js',
        path: path.resolve(__dirname, './dist')
    },
    plugins: [new HtmlWebpackPlugin({template: './src/renderer/index.html'})]
})