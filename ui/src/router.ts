import Vue from 'vue'
import Router, { RouteConfig } from 'vue-router'
import Home from '@/views/Home.vue'
import storageRoutes from '@/storage/router'
import datasourceRoutes from '@/datasource/router'
import pipelineRoutes from '@/pipeline/router'
import notificationRoutes from '@/notification/router'
import { isAuthenticated, login } from './authentication'
import { BASE_URL } from '@/env'

Vue.use(Router)

const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/about',
    name: 'about',
    meta: { title: 'About' },
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ './views/About.vue')
  },
  ...pipelineRoutes,
  ...datasourceRoutes,
  ...notificationRoutes,
  ...storageRoutes
]

const router = new Router({
  mode: 'history',
  base: BASE_URL,
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    await login()
  }
  next()
})

export default router
