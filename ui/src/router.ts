import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import transformationRoutes from '@/transformation/router';
import { isAuthenticated, keycloakLogin, keycloakInit } from './keycloak';

Vue.use(Router);

const baseRoutes = [
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
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ './views/About.vue'),
  },
];

const routes = baseRoutes.concat(transformationRoutes);

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    keycloakLogin();
  }
  next();
});

export default router;
