const {spawn, spawnSync} = require('child_process')
const Webpack = require('webpack')
const WDS = require('webpack-dev-server')
const config = require('./webpack.dev.renderer.config.js')

spawnSync('webpack', ['--config', './config/webpack.dev.main.config.js'], {stdio: 'ignore'})

console.log('[WDS] starting')
const wds = new WDS(Webpack(config), {
    port: 8000,
    hot: true
})

wds.listen(8000, 'localhost', () => {
    console.log('[WDS] started')
    const app = spawn('electron', ['dist/main.js'], {
        stdio: 'inherit'
    })

    app.on("close", () => {
        console.log('[APP] stopped')
        wds.close()
    })
})
