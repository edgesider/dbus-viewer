const {merge} = require('webpack-merge')
const devConf = require('./webpack.dev.main.config')
const {prod_source_map} = require('./config')

module.exports = merge(devConf, {
    mode: 'production',
    devtool: prod_source_map
})