import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import router from './router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/css/materialdesignicons.css'
import TransformationModule from '@/transformation/module'
import StorageModule from '@/storage/module'
import AuthModule from '@/components/auth/module'
import PipelineModule from '@/pipeline/module'

Vue.use(Vuetify, {
  iconfont: 'mdi'
})

Vue.use(Vuex)

Vue.config.productionTip = false

export const store = new Vuex.Store({
  modules: {
    auth: AuthModule,
    transformation: TransformationModule,
    storage: StorageModule,
    pipeline: PipelineModule
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
