const path = require('path')
const merge = require('./webpack.config.base')

module.exports = merge({
    target: 'electron-main',
    entry: './src/main/main.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    }
})