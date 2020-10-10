const {abs_path} = require('./utils')
const merge = require('./webpack.base.config')

module.exports = merge({
    mode: 'development',
    target: 'electron-main',
    entry: './src/main/main.ts',
    output: {
        filename: 'main.js',
        path: abs_path('dist')
    },
    devtool: 'source-map'
})