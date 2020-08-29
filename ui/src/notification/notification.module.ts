import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import NotificationConfig from './notificationConfig'
import * as RestService from './notificationRest'

@Module({ namespaced: true })
export default class NotificationModule extends VuexModule {
  private isLoadingConfigs = true
  private notifications: NotificationConfig[] = []

  @Mutation
  public setNotifications (notifications: NotificationConfig[]): void{
    this.notifications = notifications
    this.isLoadingConfigs = false
  }

  @Mutation
  public setIsLoadingNotifications (value: boolean): void {
    this.isLoadingConfigs = value
  }

  @Mutation public setIsLoadingResults (value: boolean): void {
    this.isLoadingConfigs = value
  }

  @Action({ commit: 'setNotifications', rawError: true })
  public async addNotification (notification: NotificationConfig): Promise<NotificationConfig[]> {
    await RestService.create(notification)
    return RestService.getAllByPipelineId(notification.pipelineId)
  }

  @Action({ commit: 'setNotifications', rawError: true })
  public async removeNotification (notification: NotificationConfig): Promise<NotificationConfig[]> {
    await RestService.remove(notification)
    return await RestService.getAllByPipelineId(notification.pipelineId)
  }

  @Action({ commit: 'setNotifications', rawError: true })
  public async updateNotification (notification: NotificationConfig): Promise<NotificationConfig[]> {
    await RestService.update(notification)
    return RestService.getAllByPipelineId(notification.pipelineId)
  }

  @Action({ commit: 'setNotifications', rawError: true })
  public async loadConfigsbyPipelineId (id: number): Promise<NotificationConfig[]> {
    return await RestService.getAllByPipelineId(id)
  }
}
