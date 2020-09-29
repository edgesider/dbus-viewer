const path = require('path')
const {merge} = require('webpack-merge')

const baseConf = {
    mode: 'development',
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
        extensions: ['.js', '.ts'],
        modules: ['.', 'src/', 'src/main/', 'src/renderer/', 'node_modules'],
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    devtool: 'source-map'
}

module.exports = (conf) => merge(baseConf, conf)