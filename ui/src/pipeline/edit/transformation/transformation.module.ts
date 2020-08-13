import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'

import * as TransformationRest from './transformationRest'
import { TransformationRequest, JobResult } from './transformation'

import * as DatasourceRest from '@/datasource/datasourceRest'
import { Data } from '@/datasource/datasource'

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private data: Data | null = null
  private function = ''
  private result: JobResult | null = null

  private isLoadingResult = false
  private isLoadingData = false

  private timeoutHandle: number | null = null

  @Mutation public setData (value: Data): void {
    this.data = value
    this.isLoadingData = false
  }

  @Action public setDataAndSubmit (value: Data): void {
    this.context.commit('setData', value)
    this.context.dispatch('scheduleSubmit')
  }

  @Mutation public setFunction (value: string): void {
    this.function = value
  }

  @Action public setFunctionAndSubmit (value: string): void {
    this.context.commit('setFunction', value)
    this.context.dispatch('scheduleSubmit')
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
    this.context.commit('setData', data)
  }

  @Action
  public async scheduleSubmit (): Promise<void> {
    if (this.timeoutHandle !== null) {
      window.clearTimeout(this.timeoutHandle)
    }
    const handle = window.setTimeout(() => this.context.dispatch('transformData'), 1500)
    this.context.commit('setTimeoutHandle', handle)
  }

  @Action
  public async transformData (): Promise<void> {
    if (this.data === null) {
      return
    }
    this.context.commit('setIsLoadingResult', true)
    this.context.commit('setTimeoutHandle', null)
    const request: TransformationRequest = { data: this.data, func: this.function }
    const result = await TransformationRest.transformData(request)
    this.context.commit('setResult', result)
  }
}
