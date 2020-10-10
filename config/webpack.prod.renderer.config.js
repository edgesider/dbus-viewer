const {merge} = require('webpack-merge')
const devConf = require('./webpack.dev.renderer.config')

module.exports = merge(devConf, {
    mode: 'production',
    devtool: 'none'
})
