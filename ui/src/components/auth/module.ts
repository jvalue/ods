import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
import {
  keycloakLogin,
  loadKeycloakUserProfile,
  isAuthenticated,
  keycloakInit,
  keycloakEditProfile,
} from '@/keycloak';
import { KeycloakProfile } from 'keycloak-js';

const AUTH_URL: string = process.env.VUE_APP_AUTH_SERVER_URL;

@Module({ namespaced: true })
export default class AuthModule extends VuexModule {
  private isAuth: boolean = false;
  private userProfile: KeycloakProfile = {};

  @Action({ commit: 'setAuth' })
  public async initKeycloak() {
    await keycloakInit(AUTH_URL);
    const isAuth = isAuthenticated();

    if (isAuth) {
      this.context.dispatch('loadUserProfile');
    }
    return isAuth;
  }

  @Action({ commit: 'setAuth' })
  public async login() {
    const isSuccessful: boolean = await keycloakLogin();

    if (isSuccessful) {
      this.context.dispatch('loadUserProfile');
    }

    return isSuccessful;
  }

  @Action({ commit: 'setAuth' })
  public logout() {
    this.context.commit('setUserProfile', {});
    return false;
  }

  @Action
  public async editProfile() {
    await keycloakEditProfile();
  }

  @Action({ commit: 'setUserProfile' })
  public async loadUserProfile() {
    return new Promise((resolve, reject) => {
      loadKeycloakUserProfile()
        .success(profile => {
          resolve(profile);
        })
        .error(err => {
          reject(err);
        });
    });
  }

  @Mutation
  private setAuth(value: boolean) {
    this.isAuth = value;
  }

  @Mutation private setUserProfile(value: KeycloakProfile) {
    this.userProfile = value;
  }
}
