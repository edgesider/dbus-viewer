import dbus from 'dbus-next'
import {ipcMain} from 'electron'

const {Message, MessageType} = dbus

let sessionBus
let systemBus
createSessionBus()
createSystemBus()

function createSessionBus() {
    console.log('session bus connecting')
    sessionBus = dbus.sessionBus()
    sessionBus._connection.stream.on('end', createSessionBus)
}

function createSystemBus() {
    console.log('system bus connecting')
    systemBus = dbus.systemBus()
    systemBus._connection.stream.on('end', createSystemBus)
}

const getBus = bus_name => bus_name === 'session' ? sessionBus : systemBus

async function dbusCall(bus, name, path, iface, method, args?, option?) {
    const call = new Message({
        destination: name,
        path,
        interface: iface,
        member: method,
        body: args,
        type: MessageType.METHOD_CALL,
        ...option
    })
    if (typeof bus === 'string')
        bus = getBus(bus)
    try {
        return (await bus.call(call)).body[0]
    } catch (e) {
        throw e
    }
}

async function getNames(_, bus_name) {
    return await dbusCall(bus_name,
        'org.freedesktop.DBus', '/org/freedesktop/DBus',
        'org.freedesktop.DBus', 'ListNames')
}

async function inspect(_, bus_name, name, path) {
    return await dbusCall(bus_name, name, path, 'org.freedesktop.DBus.Introspectable', 'Introspect')
}

async function getProperty(_, bus, name, path, iface, property) {
    return await dbusCall(bus, name, path,
        'org.freedesktop.DBus.Properties', 'Get',
        [iface, property], {signature: 'ss'})
}

function ipcHandle(channel, action) {
    const f = async (...args) => {
        try {
            return await action(...args)
        } catch (e) {
            return e
        }
    }
    ipcMain.handle(channel, f)
}

export function initIPC() {
    ipcHandle('getNames', getNames)
    ipcHandle('inspect', inspect)
    ipcHandle('call', (e, ...args) =>
        // @ts-ignore
        dbusCall(...args))
    ipcHandle('getProperty', getProperty)
}
