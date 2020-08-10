import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import {
  UserProfile,
  login,
  getUserProfile,
  isAuthenticated,
  initAuthentication,
  editUserProfile
} from '@/authentication'

@Module({ namespaced: true })
export default class AuthModule extends VuexModule {
  private isAuth = false

  private userProfile: UserProfile = {}

  @Action({ commit: 'setAuth' })
  public async init (): Promise<boolean> {
    await initAuthentication()
    const isAuth = isAuthenticated()

    if (isAuth) {
      this.context.dispatch('loadUserProfile')
    }
    return isAuth
  }

  @Action({ commit: 'setAuth' })
  public async login (): Promise<boolean> {
    const isSuccessful: boolean = await login()

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
    return await editUserProfile()
  }

  @Action({ commit: 'setUserProfile' })
  public async loadUserProfile (): Promise<UserProfile> {
    return await getUserProfile()
  }

  @Mutation
  private setAuth (value: boolean): void {
    this.isAuth = value
  }

  @Mutation private setUserProfile (value: UserProfile): void {
    this.userProfile = value
  }
}
