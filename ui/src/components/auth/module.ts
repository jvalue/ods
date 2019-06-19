import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import {
  keycloakLogin,
  loadKeycloakUserProfile,
  isAuthenticated,
  keycloakInit,
  keycloakEditProfile
} from '@/keycloak'
// eslint-disable-next-line no-unused-vars
import { KeycloakProfile } from 'keycloak-js'

const AUTH_URL: string = process.env.VUE_APP_AUTH_SERVER_URL as string

@Module({ namespaced: true })
export default class AuthModule extends VuexModule {
  private isAuth: boolean = false
  private userProfile: KeycloakProfile = {}

  @Action({ commit: 'setAuth' })
  public async initKeycloak (): Promise<boolean> {
    await keycloakInit(AUTH_URL)
    const isAuth = isAuthenticated()

    if (isAuth) {
      this.context.dispatch('loadUserProfile')
    }
    return isAuth
  }

  @Action({ commit: 'setAuth' })
  public async login (): Promise<boolean> {
    const isSuccessful: boolean = await keycloakLogin()

    if (isSuccessful) {
      this.context.dispatch('loadUserProfile')
    }

    return isSuccessful
  }

  @Action({ commit: 'setAuth' })
  public logout (): boolean {
    this.context.commit('setUserProfile', {})
    return false
  }

  @Action
  public async editProfile (): Promise<boolean> {
    return keycloakEditProfile()
  }

  @Action({ commit: 'setUserProfile' })
  public async loadUserProfile (): Promise<Keycloak.KeycloakProfile> {
    return new Promise((resolve, reject) => {
      loadKeycloakUserProfile()
        .then(profile => {
          resolve(profile)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  @Mutation
  private setAuth (value: boolean): void {
    this.isAuth = value
  }

  @Mutation private setUserProfile (value: KeycloakProfile): void {
    this.userProfile = value
  }
}
