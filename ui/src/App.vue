<template>
  <div id="app">
    <v-app>
      <v-navigation-drawer
        v-model="drawer"
        clipped
        app
      >
        <v-toolbar
          dense
          dark
          color="primary"
        >
          <v-toolbar-side-icon @click.stop="drawer = !drawer" />
          <v-toolbar-title>{{ title }}</v-toolbar-title>
        </v-toolbar>
        <v-list>
          <v-list-tile
            v-for="item in items"
            :key="item.title"
            :to="item.route"
          >
            <v-list-tile-content>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-navigation-drawer>

      <v-toolbar
        dense
        dark
        color="primary"
      >
        <v-toolbar-side-icon @click.stop="drawer = !drawer" />
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer />
        <v-toolbar-title>{{ routerTitle }}</v-toolbar-title>
        <v-spacer />

        <login />
      </v-toolbar>
      <v-content>
        <v-container fluid>
          <router-view />
        </v-container>
      </v-content>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Login from '@/components/Login.vue'
import Router from '@/router'

@Component({
  components: {
    login: Login
  }
})
export default class App extends Vue {
  private title: string = 'Open-Data-Service';

  private routerTitle: string = '';

  private drawer = null;

  private items = [
    { title: 'Dashboard', route: '/' },
    { title: 'Pipelines', route: '/pipeline' },
    { title: 'Transformation', route: '/transformation' },
    { title: 'About', route: '/about' }
  ];

  private created () {
    this.routerTitle = Router.currentRoute.meta.title || ''

    Router.afterEach((to) => {
      this.routerTitle = to.meta.title || ''
    })
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
