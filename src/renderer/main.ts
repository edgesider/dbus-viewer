import Vue from 'vue'
import Vuetify from "vuetify/lib"

Vue.use(Vuetify)

import App from './App.vue'
import './main.css'

new Vue({
    render: h => h(App),
    vuetify: new Vuetify({
        theme: {dark: false}
    })
}).$mount('#app')