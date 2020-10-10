const HtmlWebpackPlugin = require('html-webpack-plugin')
const merge = require('./webpack.base.config')
const {abs_path} = require('./utils')

module.exports = merge({
    mode: 'development',
    target: 'electron-renderer',
    entry: ['./src/renderer/renderer.ts', './src/renderer/main.css'],
    output: {
        filename: 'renderer.js',
        path: abs_path('dist')
    },
    plugins: [new HtmlWebpackPlugin({template: abs_path('src/renderer/index.html')})],
    devtool: 'source-map'
})