import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import Pipeline from './pipeline'
import * as RestService from './pipelineRest'
import NotificationConfig from '@/pipeline/notifications/notificationConfig'

@Module({ namespaced: true })
export default class PipelineModule extends VuexModule {
  private pipelines: Pipeline[] = []

  private selectedPipeline: Pipeline = {} as unknown as Pipeline

  private isLoadingPipelines = true

  @Mutation
  public setPipelines (pipelines: Pipeline[]): void {
    this.pipelines = pipelines
    this.isLoadingPipelines = false
  }

  @Mutation
  public setSelectedPipeline (pipeline: Pipeline): void {
    this.selectedPipeline = pipeline
  }

  @Mutation
  public setIsLoadingPipelines (value: boolean): void {
    this.isLoadingPipelines = value
  }

  @Action({ commit: 'setPipelines' })
  public async loadPipelines (): Promise<Pipeline[]> {
    this.context.commit('setIsLoadingPipelines', true)

    return RestService.getAllPipelines()
  }

  @Action({ commit: 'setSelectedPipeline' })
  public async loadPipelineById (id: number): Promise<Pipeline> {
    return RestService.getPipelineById(id)
  }

  @Action({ commit: 'setPipelines' })
  public async createPipeline (pipeline: Pipeline): Promise<Pipeline[]> {
    await RestService.createPipeline(pipeline)
    return RestService.getAllPipelines()
  }

  @Action({ commit: 'setPipelines' })
  public async updatePipeline (pipeline: Pipeline): Promise<Pipeline[]> {
    await RestService.updatePipeline(pipeline)
    return RestService.getAllPipelines()
  }

  @Action({ commit: 'setPipelines' })
  public async deletePipeline (pipelineId: number): Promise<Pipeline[]> {
    await RestService.deletePipeline(pipelineId)
    return RestService.getAllPipelines()
  }

  @Action({ commit: 'setSelectedPipeline' })
  public async addNotification (notification: NotificationConfig): Promise<Pipeline> {
    const newPipeline: Pipeline = Object.assign({}, this.selectedPipeline)
    newPipeline.notifications.push(Object.assign({}, notification))
    await RestService.updatePipeline(newPipeline)
    return RestService.getPipelineById(newPipeline.id)
  }

  @Action({ commit: 'setSelectedPipeline' })
  public async updateNotification (notification: NotificationConfig): Promise<Pipeline> {
    console.log('update')
    const newPipeline: Pipeline = Object.assign({}, this.selectedPipeline)
    const nIdx = this.selectedPipeline.notifications
      .findIndex(n => n.notificationId === notification.notificationId)
    newPipeline.notifications[nIdx] = notification
    await RestService.updatePipeline(newPipeline)
    return RestService.getPipelineById(newPipeline.id)
  }

  @Action({ commit: 'setSelectedPipeline' })
  public async removeNotification (notification: NotificationConfig): Promise<Pipeline> {
    const newPipeline: Pipeline = Object.assign({}, this.selectedPipeline)
    newPipeline.notifications = this.selectedPipeline.notifications
      .filter(n => n.notificationId !== notification.notificationId)
    await RestService.updatePipeline(newPipeline)
    return RestService.getPipelineById(newPipeline.id)
  }
}
