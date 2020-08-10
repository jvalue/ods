import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home.vue'
import storageRoutes from '@/storage/router'
import datasourceRoutes from '@/datasource/router'
import pipelineRoutes from '@/pipeline/router'
import notificationRoutes from '@/notification/router'
import { isAuthenticated, login } from './authentication'

Vue.use(Router)

let routes = [
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
  }
]

routes = routes.concat(pipelineRoutes)
routes = routes.concat(datasourceRoutes)
routes = routes.concat(notificationRoutes)
routes = routes.concat(storageRoutes)

const router = new Router({
  mode: 'history',
  base: process.env.VUE_APP_BASE_URL,
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    await login()
  }
  next()
})

export default router
