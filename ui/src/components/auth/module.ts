import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';

import {
  UserProfile,
  editUserProfile,
  getUserProfile,
  initAuthentication,
  isAuthenticated,
  login,
} from '@/authentication';

@Module({ namespaced: true })
export default class AuthModule extends VuexModule {
  private isAuth = false;

  private userProfile: UserProfile = {};

  @Action({ commit: 'setAuth' })
  async init(): Promise<boolean> {
    await initAuthentication();
    const isAuth = isAuthenticated();

    if (isAuth) {
      await this.context.dispatch('loadUserProfile');
    }
    return isAuth;
  }

  @Action({ commit: 'setAuth' })
  async login(): Promise<boolean> {
    const isSuccessful: boolean = await login();

    if (isSuccessful) {
      await this.context.dispatch('loadUserProfile');
    }

    return isSuccessful;
  }

  @Action({ commit: 'setAuth' })
  logout(): boolean {
    this.context.commit('setUserProfile', {});
    return false;
  }

  @Action
  async editProfile(): Promise<boolean> {
    return await editUserProfile();
  }

  @Action({ commit: 'setUserProfile' })
  async loadUserProfile(): Promise<UserProfile> {
    return await getUserProfile();
  }

  @Mutation
  private setAuth(value: boolean): void {
    this.isAuth = value;
  }

  @Mutation private setUserProfile(value: UserProfile): void {
    this.userProfile = value;
  }
}
