<template>
  <v-toolbar-items>
    <v-btn
      v-show="!isAuthenticated"
      text
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
          text
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
        <v-list-item avatar>
          <v-list-item-content>
            <v-list-item-title>{{ userProfile.firstName }} {{ userProfile.lastName }}</v-list-item-title>
            <v-list-item-sub-title>{{ userProfile.email }}</v-list-item-sub-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider />

        <v-list-item
          disabled
          @click="onEditProfile"
        >
          <v-list-item-title>Edit Profile</v-list-item-title>
        </v-list-item>
        <v-list-item @click="onLogout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-toolbar-items>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Action, State } from 'vuex-class'
import { UserProfile } from '@/authentication'

const namespace = { namespace: 'auth' }

@Component
export default class Login extends Vue {
  private menu = false;

  @State('isAuth', namespace)
  private isAuthenticated!: boolean;

  @State('userProfile', namespace)
  private userProfile!: UserProfile;

  @Action('login', namespace)
  private login!: () => Promise<boolean>;

  @Action('logout', namespace)
  private logout!: () => boolean;

  @Action('editProfile', namespace)
  private editProfile!: () => Promise<boolean>;

  @Action('init', namespace)
  private init!: () => Promise<boolean>;

  private async mounted (): Promise<void> {
    await this.init()
  }

  private async onLogin (): Promise<void> {
    await this.login()
  }

  private onLogout (): void {
    this.logout()
    this.menu = false
  }

  private async onEditProfile (): Promise<void> {
    this.editProfile()
  }
}
</script>
