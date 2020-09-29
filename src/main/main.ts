import {app, BrowserWindow} from 'electron'
import {initIPC} from '@/main/dbus'

async function init() {
    initIPC()
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        webPreferences: {
            nodeIntegration: true,
        },
        autoHideMenuBar: true,
        darkTheme: false,
        show: false,
    })
    win.webContents.on('new-window', e => {
        e.preventDefault()
    })
    win.removeMenu()
    win.once('ready-to-show', win.show)
    await win.loadFile('./index.html')
    win.webContents.setZoomFactor(1)
    if (!app.isPackaged)
        win.webContents.openDevTools({mode: 'detach'})
}

app.whenReady().then(init)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
