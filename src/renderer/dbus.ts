import {ipcRenderer} from "electron";

async function ipcCall(channel, ...args) {
    const resp = await ipcRenderer.invoke(channel, ...args)
    if (resp instanceof Error) {
        throw resp
    } else {
        return resp
    }
}

export default {
    async inspect(bus, name, path) {
        const data = await ipcCall('inspect', bus, name, path)
        return new DOMParser().parseFromString(data, 'text/xml').firstElementChild
    },
    async getNames(bus) {
        return await ipcCall('getNames', bus)
    },
    async call(bus, name, path, iface, method, ...args) {
        return await ipcCall('call', bus, name, path, iface, method, ...args)
    },
    async getProperty(bus, name, path, iface, property) {
        return await ipcCall('getProperty', bus, name, path, iface, property)
    }
}
