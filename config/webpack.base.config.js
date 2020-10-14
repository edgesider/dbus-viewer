const {abs_path} = require('./utils')
const {merge} = require('webpack-merge')

module.exports = conf => merge({
    module: {
        rules: [{
            test: /\.ts$/,
            loader: 'ts-loader',
            options: {
                appendTsSuffixTo: [/\.vue$/]
            }
        }, {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.(png|jpg|gif)$/i,
            use: 'url-loader'
        }, {
            test: /\.vue$/,
            use: 'vue-loader'
        }, {
            test: /\.s[ac]ss$/,
            use: ['style-loader', 'css-loader', {
                loader: 'sass-loader',
                options: {
                    additionalData:  '@import "@/renderer/variables.sass"'
                }
            }]
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