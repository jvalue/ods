import Vue from 'vue';
import Router, { RouteConfig } from 'vue-router';

import { isAuthenticated, login } from './authentication';

import datasourceRoutes from '@/datasource/router';
import { BASE_URL } from '@/env';
import notificationRoutes from '@/notification/router';
import pipelineRoutes from '@/pipeline/router';
import RouterMeta from '@/routerMeta';
import storageRoutes from '@/storage/router';
import Home from '@/views/Home.vue';

Vue.use(Router);

const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Dashboard' },
  },
  {
    path: '/about',
    name: 'about',
    meta: { title: 'About' },
    // Route level code-splitting
    // This generates a separate chunk (about.[hash].js) for this route
    // Which is lazy-loaded when the route is visited.
    component: async (): Promise<typeof import('*.vue')> =>
      await import(/* WebpackChunkName: "about" */ './views/About.vue'),
  },
  ...pipelineRoutes,
  ...datasourceRoutes,
  ...notificationRoutes,
  ...storageRoutes,
];

const router = new Router({
  mode: 'history',
  base: BASE_URL,
  routes,
});

router.beforeEach(async (to, from, next) => {
  if ((to.meta as RouterMeta).requiresAuth === true && !isAuthenticated()) {
    await login();
  }
  next();
});

export default router;
