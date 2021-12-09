import Vue, { VNode } from 'vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';

import App from './App.vue';
import router from './router';

import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';
import AuthModule from '@/components/auth/module';
import TransformationModule from '@/pipeline/edit/transformation/transformation.module';
import PipelineModule from '@/pipeline/pipeline.module';

Vue.use(Vuetify);
const vuetify = new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
});

Vue.use(Vuex);

Vue.config.productionTip = false;

export const store = new Vuex.Store({
  modules: {
    auth: AuthModule,
    transformation: TransformationModule,
    pipeline: PipelineModule,
  },
});

new Vue({
  vuetify,
  router,
  store,
  render: (h): VNode => h(App),
}).$mount('#app');
