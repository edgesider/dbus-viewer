const {abs_path} = require('./utils')
const {merge} = require('webpack-merge')

module.exports = conf => merge({
    module: {
        rules: [{
            test: /\.ts$/,
            use: ['ts-loader']
        }, {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.(png|jpg|gif)$/i,
            use: ['url-loader']
        }]
    },
    resolve: {
        extensions: ['.js', '.ts', '.vue', '.sass'],
        alias: {
            '@': abs_path('src')
        }
    },
    stats: {
        colors: true,
        chunks: false,
        modules: false
    },
}, conf)