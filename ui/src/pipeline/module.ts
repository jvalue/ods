import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import Pipeline from './pipeline'
import * as RestService from './pipelineRest'

@Module({ namespaced: true })
export default class PipelineModule extends VuexModule {
  private pipelines: Pipeline[] = []

  private isLoadingPipelines: boolean = true

  @Mutation
  public setPipelines (pipelines: Pipeline[]): void {
    this.pipelines = pipelines
    this.isLoadingPipelines = false
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
  public async deletePipeline (pipelineId: string): Promise<Pipeline[]> {
    await RestService.deletePipeline(pipelineId)
    return RestService.getAllPipelines()
  }

}
