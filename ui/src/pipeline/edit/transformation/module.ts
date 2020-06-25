import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'

import * as TransformationRest from './transformationRest'
import { TransformationRequest, JobResult } from './transformation'

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private transformationResult: JobResult | null = null

  private isLoadingResults = false

  @Action({ commit: 'setTransformationResult' })
  public async transformData (request: TransformationRequest): Promise<JobResult> {
    this.context.commit('setIsLoadingResults', true)

    return TransformationRest.transformData(request)
  }

  @Mutation public setTransformationResult (value: JobResult): void {
    this.transformationResult = value
    this.isLoadingResults = false
  }

  @Mutation public setIsLoadingResults (value: boolean): void {
    this.isLoadingResults = value
  }
}
