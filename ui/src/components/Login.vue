<template>
  <v-toolbar-items>
    <v-btn
      v-show="!isAuthenticated"
      flat
      @click="onLogin"
    >
      Login
      <v-icon
        dark
        right
      >
        mdi-account
      </v-icon>
    </v-btn>

    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-width="200"
      offset-x
    >
      <template v-slot:activator="{ on }">
        <v-btn
          v-show="isAuthenticated"
          flat
          to="/"
          v-on="on"
        >
          {{ userProfile.firstName }}
          <v-icon
            dark
            right
          >
            mdi-chevron-down
          </v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-tile avatar>
          <v-list-tile-content>
            <v-list-tile-title>{{ userProfile.firstName }} {{ userProfile.lastName }}</v-list-tile-title>
            <v-list-tile-sub-title>{{ userProfile.email }}</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider />

        <v-list-tile @click="onEditProfile">
          <v-list-tile-title>Edit Profile</v-list-tile-title>
        </v-list-tile>
        <v-list-tile @click="onLogout">
          <v-list-tile-title>Logout</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
  </v-toolbar-items>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Action, State } from 'vuex-class'
import { KeycloakProfile } from 'keycloak-js'

const namespace = { namespace: 'auth' }

@Component
export default class Login extends Vue {
  private menu: boolean = false;

  @State('isAuth', namespace)
  private isAuthenticated!: boolean;

  @State('userProfile', namespace)
  private userProfile!: KeycloakProfile;

  @Action('login', namespace)
  private login!: () => void;

  @Action('logout', namespace)
  private logout!: () => void;

  @Action('editProfile', namespace)
  private editProfile!: () => void;

  @Action('initKeycloak', namespace)
  private initKeycloak!: () => void;

  private mounted () {
    console.log('mounted')
    this.initKeycloak()
  }

  private onLogin () {
    this.login()
  }

  private onLogout () {
    this.logout()
    this.menu = false
  }

  private onEditProfile () {
    this.editProfile()
  }
}
</script>
