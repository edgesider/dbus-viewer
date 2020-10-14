<template>
    <v-app>
        <v-main>
            <div class="content">
                <div class="row1">
                    <v-row justify="center">
                        <v-col cols="3">
                            <v-select :items="buses"
                                      @change="loadNames"
                                      v-model="bus"
                                      hide-details
                                      prepend-icon="mdi-bus"
                                      dense></v-select>
                        </v-col>
                        <v-col cols="7">
                            <v-select :items="names"
                                      @change="initTree"
                                      hide-details
                                      v-model="name"
                                      prepend-icon="mdi-view-list"
                                      dense></v-select>
                        </v-col>
                    </v-row>
                </div>
                <v-divider/>
                <div class="row2">
                    <v-fab-transition>
                        <v-btn fab small fixed bottom right
                               style="transform: translateY(0)"
                               @click="toggleDark">
                            <v-icon>mdi-brightness-6</v-icon>
                        </v-btn>
                    </v-fab-transition>
                    <v-fab-transition>
                        <v-btn fab small fixed bottom right
                               style="transform: translateY(-50px)"
                               @click="initTree">
                            <v-icon>mdi-cached</v-icon>
                        </v-btn>
                    </v-fab-transition>
                    <v-row justify="center">
                        <v-col cols="10">
                            <v-treeview dense
                                        :load-children="loadNode"
                                        :items="objects"
                                        :open.sync="open"
                                        open-on-click>
                                <template v-slot:append="{item}">
                                    <v-btn v-if="item.type === 'method'"
                                           color="primary" text small
                                           @click="callMethod(item)">
                                        Call
                                    </v-btn>
                                    <v-row v-else-if="item.type === 'property'">
                                        <v-btn color="primary" text small
                                               @click="getProperty(item)">
                                            Get
                                        </v-btn>
                                        <v-btn color="primary" text small
                                               @click="setProperty(item)">
                                            Set
                                        </v-btn>
                                        <div class="mr-3"></div>
                                    </v-row>
                                    <v-btn v-else-if="item.type === 'signal'"
                                           color="primary" text small
                                           @click="attachSignal(item)">
                                        Attach
                                    </v-btn>
                                </template>
                            </v-treeview>
                        </v-col>
                    </v-row>
                </div>
                <v-divider/>
                <div class="row3">
                    <v-row justify="center">
                        <v-col cols="10">
                        </v-col>
                    </v-row>
                </div>
            </div>
        </v-main>
    </v-app>
</template>

<script>
    import Vue from 'vue'
    import dbus from "@/renderer/dbus";

    export default Vue.extend({
        mounted() {
            this.loadNames('session')
        },
        data: () => ({
            console: console,
            buses: [{text: 'Session Bus', value: 'session'}, {text: 'System Bus', value: 'system'}],
            names: [...Array(20).keys()],
            bus: 'session',
            name: '',
            objects: [{
                id: 0,
                name: 'Loading',  // 显示名称
                nodeName: '',
                children: [],
            }],
            open: [],
            nextId: 1
        }),
        methods: {
            async loadNames(bus) {
                const names = (await dbus.getNames(bus)).sort((a, b) => {
                    // 把:开头的放到最后
                    const a_colon = a.startsWith(':'), b_colon = b.startsWith(':')
                    if (a_colon === b_colon) {
                        return a === b ? 0 : a > b ? 1 : -1
                    }
                    return a_colon ? 1 : -1;
                })
                this.names.splice(0, this.names.length, ...names)
                this.name = names[0]
                await this.initTree()
            },
            async initTree() {
                this.objects.splice(0, this.objects.length,
                    {id: 0, name: 'Loading', children: []})
                this.$nextTick(() =>
                    this.open.splice(0, this.open.length, 0))
            },
            async loadNode(item) {
                if (item.id === 0) {
                    // root
                    const xml = await dbus.inspect(this.bus, this.name, '/')
                    const children = this.xml2tree(xml).children
                    children.forEach(child => child.parent = null)
                    this.objects.splice(0, this.objects.length, ...children)
                } else {
                    const path = this.getPath(item).nodePath
                    const xml = await dbus.inspect(this.bus, this.name, path)
                    const children = this.xml2tree(xml).children
                    if (children.length > 0) {
                        children.forEach(child => child.parent = item)
                        item.children.push(...children)
                    } else {
                        item.children = undefined
                    }
                }
            },
            getPath(item) {
                let nodePath = '', iface, member

                while (item) {
                    switch (item.type) {
                        case 'node':
                            nodePath = `${item.nodeName}/${nodePath}`
                            break
                        case 'interface':
                            iface = item.nodeName
                            break
                        case 'property':
                        case 'method':
                        case 'signal':
                            member = item.nodeName
                            break
                    }
                    item = item.parent
                }
                if (nodePath && nodePath.endsWith('/'))
                    nodePath = nodePath.substr(0, nodePath.length - 1)
                nodePath = '/' + nodePath

                return {nodePath, iface, member}
            },
            xml2tree(xml, parent) {
                const name = xml.getAttribute('name')
                window.xml = xml
                const item = {
                    id: this.nextId++,
                    name: '',
                    nodeName: name,
                    type: xml.tagName,
                    parent,
                    children: undefined,
                }
                switch (xml.tagName) {
                    case 'node':
                        item.name = `[O] ${name}`
                        item.children = [...xml.children].map(child => this.xml2tree(child, item))
                        break
                    case 'interface':
                        item.name = `[I] ${name}`
                        if (xml.childElementCount > 0)
                            item.children = [...xml.children].map(child => this.xml2tree(child, item))
                        break
                    case 'method':
                        item.name = `[M] ${name}`
                        break
                    case 'signal':
                        item.name = `[S] ${name}`
                        break
                    case 'property':
                        item.name = `[P] ${name}`
                        break
                }
                return item
            },
            toggleDark() {
                this.$vuetify.theme.dark = !this.$vuetify.theme.dark
            },

            async callMethod(item) {
                const {nodePath, iface, member} = this.getPath(item)
                console.log(`call method: ${nodePath}:${iface}.${member}`)
                if (!nodePath || !iface || !member)
                    return
                const resp = await dbus.call(this.bus, this.name, nodePath, iface, member)
                console.log(resp)
            },
            async getProperty(item) {
                const {nodePath, iface, member} = this.getPath(item)
                console.log(`get property: ${nodePath}:${iface}.${member}`)
            },
            async setProperty(item) {
                const {nodePath, iface, member} = this.getPath(item)
                console.log(`set property: ${nodePath}:${iface}.${member}`)
            },
            async attachSignal(item) {
                const {nodePath, iface, member} = this.getPath(item)
                console.log(`attach signal: ${nodePath}:${iface}.${member}`)
            }
        }
    })
</script>

<style>
    .content {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: start;
    }

    .row1 {
        flex: 0 0;
    }

    .row2 {
        position: relative;
        flex: 0 0 45%;
        /*noinspection CssInvalidPropertyValue*/
        overflow-y: overlay;
        overflow-x: hidden;
    }

    .row3 {
        flex: 0 1 45%;
    }
</style>
