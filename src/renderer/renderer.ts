import $ from 'jquery'
import 'jstree'
import {ipcRenderer} from 'electron'

$(function () {
    /**
     * 当展开obj对象时加载数据
     */
    async function dataLoader(obj, res) {
        const bus = elBus.val()
        const name = elNames.val()
        if (obj.id === '#') {
            // 加载根节点
            const xml = await dbus.inspect(bus, name, '/')
            res.call(this, el2tree(xml).children)
        } else {
            const path = getPath(obj)[3]
            const xml = await dbus.inspect(bus, name, path)
            obj = el2tree(xml).children
            res.call(this, obj)
        }
    }

    function getTree() {
        return elData.jstree(true)
    }

    /**
     * 获取obj对象所在的路径
     * @param obj
     * @returns [object_path, interface, member, sum] interface和member不存在时为null，sum为object_path/interface
     */
    function getPath(obj) {
        let sum = null
        let path = ''
        let iface = null
        let member = null

        const tree = getTree()
        const parents = [...obj.parents]
        parents.pop()  // 移除'#'
        parents.reverse()
        const p_nodes = parents.map(p => tree.get_node(p))

        // 连接parents中所有的node节点
        for (let p_node of p_nodes.filter(n => n.original.type === 'node'))
            path += '/' + p_node.original.name
        switch (obj.original.type) {
            case 'node':
                path += '/' + obj.original.name
                break
            case 'interface':
                iface = obj.original.name
                break
            case 'signal':
            case 'property':
            case 'method':
                iface = p_nodes[p_nodes.length - 1].original.name
                member = obj.original.name
                break
        }
        if (path) {
            sum = path
            if (iface)
                sum += '/' + iface
        }

        return [path, iface, member, sum]
    }

    async function updateNames() {
        const names = (await dbus.getNames(elBus.val())).sort((a, b) => {
            // 把:开头的放到最后
            const a_colon = a.startsWith(':'), b_colon = b.startsWith(':')
            if (a_colon === b_colon) {
                return a === b ? 0 : a > b ? 1 : -1
            }
            return a_colon ? 1 : -1;
        })
        elNames.empty()
        elNames.append(...names.map(name => {
            const el = document.createElement('option')
            $(el).text(name)
            return el
        }))
        await updateData()
    }

    async function updateData() {
        getTree().refresh(false, true)
    }

    const styles = {
        node: '',
        interface: '',
        method: '',
        signal: '',
        property: '',
        // method: 'font-style: italic;',
        // signal: 'font-weight: bold;',
        // property: 'text-decoration: underline;',
    }

    function el2tree(el) {
        const name = el.getAttribute('name')
        // let text = `[${el.tagName[0].toUpperCase()}] ` + name
        let text
        let children: any = []
        switch (el.tagName) {
            case 'node':
                text = `[O] ${name}`
                if (el.childElementCount === 0 && name) {
                    // 如果节点为空且有名字，则需要懒加载
                    children = true
                } else {
                    children = []
                    $(el).children().each((i, child) => {
                        children.push(el2tree(child))
                    })
                }
                break
            case 'interface':
                children = []
                text = `[I] ${name}`
                $(el).children().each((i, child) => {
                    children.push(el2tree(child))
                })
                break
            case 'method':
                text = `[M] ${name}`
                break
            case 'signal':
                text = `[S] ${name}`
                break
            case 'property':
                switch (el.getAttribute('access')) {
                    case 'read':
                        text = `[P,ro] ${name}`
                        break
                    case 'readwrite':
                        text = `[P,rw] ${name}`
                        break
                }
                break
        }
        return {
            text, children,
            name,  // 节点名，用于拼接path
            type: el.tagName,
            a_attr: {type: el.tagName, style: styles[el.tagName]}
        }
    }

    const log = {
        i(msg) {
            console.log(msg)
            this._log(msg, 'log')
        },
        e(msg) {
            console.error(msg)
            this._log(msg, 'error')
        },
        _log(msg, type) {
            const el = $('<div></div>')
            if (typeof msg === 'object' && !(msg instanceof Error)) {
                msg = JSON.stringify(msg)
            }
            el.text(msg)
            el.addClass('log-item')
            if (type === 'error')
                el.addClass('log-error')
            elLogs.append(el)
            elLogs.scrollTop(elLogs[0].scrollHeight)
        }
    }

    async function ipcCall(channel, ...args) {
        const resp = await ipcRenderer.invoke(channel, ...args)
        if (resp instanceof Error) {
            throw resp
        } else {
            return resp
        }
    }

    const dbus = {
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

    const elBus = $('#sel-bus')
    const elNames = $('#sel-name')
    const elData = $('.data')
    const elLogs = $('.logs')
    elData.jstree({
        core: {
            data: async function (obj, res) {
                try {
                    await dataLoader(obj, res)
                } catch (e) {
                    log.e(e)
                }
            },
            themes: {stripes: true},
        },
        plugins: ['wholerow'],
        types: {}
    }).on('dblclick.jstree', async function (ev) {
        const tree = getTree()
        const node = tree.get_node(ev.target)
        if (!node)
            return
        const bus = elBus.val()
        const name = elNames.val()
        const path = getPath(node)
        try {
            switch (node.original.type) {
                case 'method':
                    log.i(`[method call] ${path[2]}`)
                    const data = await dbus.call(bus, name, path[0], path[1], path[2])
                    log.i(data)
                    break
                case 'signal':
                    log.i(`[signal attach] ${path[2]}`)
                    break
                case 'property':
                    log.i(`[property get] ${path[2]}`)
                    const value = await dbus.getProperty(bus, name, path[0], path[1], path[2])
                    log.i(value)
                    break
                default:
                    return
            }
        } catch (e) {
            log.e(e)
        }
    })
    elBus.on('change', updateNames)
    elNames.on('change', updateData)
    $(updateNames)
})
