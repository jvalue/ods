import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'

import { TransformationRest } from './transformationRest'
import { TransformationRequest, JobResult } from './transformation'

import * as DatasourceRest from '@/datasource/datasourceRest'
import { Data } from '@/datasource/datasource'
import { PIPELINE_SERVICE_URL } from '@/env'

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private data: Data | null = null
  private function = ''
  private result: JobResult | null = null

  private isLoadingResult = false
  private isLoadingData = false

  private timeoutHandle: number | null = null

  private readonly transformationRest = new TransformationRest(PIPELINE_SERVICE_URL)

  @Mutation public setData (value: Data): void {
    this.data = value
    this.isLoadingData = false
  }

  // has to be an action because of the asynchronous submit
  @Action public setDataAndSubmit (value: Data): void {
    this.context.commit('setData', value)
    this.context.dispatch('scheduleSubmit')
      .catch(() => {})
  }

  @Mutation public setFunction (value: string): void {
    this.function = value
  }

  // has to be an action because of the asynchronous submit
  @Action public setFunctionAndSubmit (value: string): void {
    this.context.commit('setFunction', value)
    this.context.dispatch('scheduleSubmit')
      .catch(() => {})
  }

  @Mutation public setResult (value: JobResult): void {
    this.result = value
    this.isLoadingResult = false
  }

  @Mutation public setIsLoadingResult (value: boolean): void {
    this.isLoadingResult = value
  }

  @Mutation public setIsLoadingData (value: boolean): void {
    this.isLoadingData = value
  }

  @Mutation private setTimeoutHandle (value: number): void {
    this.timeoutHandle = value
  }

  @Action
  public async loadDataFromDatasource (datasourceId: number): Promise<void> {
    this.context.commit('setIsLoadingData', true)
    const data = await DatasourceRest.getDatasourceData(datasourceId)
    this.context.dispatch('setDataAndSubmit', data)
      .catch(() => {})
  }

  @Action
  public async scheduleSubmit (): Promise<void> {
    // if there is another submit schedule, abort it
    if (this.timeoutHandle !== null) {
      window.clearTimeout(this.timeoutHandle)
    }
    // schedule the dispatch and get the handle
    const handle = window.setTimeout(() => {
      this.context.dispatch('transformData').catch(() => {})
    }, 1500)
    // save the handle in the module state
    this.context.commit('setTimeoutHandle', handle)
  }

  @Action
  public async transformData (): Promise<void> {
    if (this.data === null) {
      return
    }
    this.context.commit('setIsLoadingResult', true)
    // reset timeout handle
    this.context.commit('setTimeoutHandle', null)
    const request: TransformationRequest = { data: this.data, func: this.function }
    const result = await this.transformationRest.transformData(request)
    // save the result in the module state
    this.context.commit('setResult', result)
  }
}
