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

const AUTH_DISABLED: boolean = process.env.VUE_APP_AUTH_DISABLED === 'true'
const AUTH_SERVICE_URL: string = process.env.VUE_APP_AUTH_SERVICE_URL as string

@Module({ namespaced: true })
export default class AuthModule extends VuexModule {
  private isAuth = false

  private userProfile: KeycloakProfile = {}

  @Action({ commit: 'setAuth' })
  public async initKeycloak (): Promise<boolean> {
    if (AUTH_DISABLED) {
      return false
    }
    console.log(`Using '${AUTH_SERVICE_URL}' as Keycloak URL`)
    await keycloakInit(AUTH_SERVICE_URL)
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
