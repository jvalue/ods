import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import APIConfig from './api'
import * as RestService from './apiRest'
import Datasource from "@/datasource/datasource";
import {AxiosResponse} from "axios";
import * as http from "http";

@Module({ namespaced: true })
export default class APIModule extends VuexModule {
  private apiConfigs: APIConfig[] = []
  private selectedAPIConfig?: APIConfig = undefined

  private isLoadingAPIConfigs = true

  @Mutation
  public setAPIConfigs (apiConfigs: APIConfig[]): void {
    this.apiConfigs = apiConfigs
    this.isLoadingAPIConfigs = false
  }

  @Mutation
  public setSelectedAPIConfig (api: APIConfig): void {
    this.selectedAPIConfig = api
  }

  @Mutation
  public setIsLoadingAPI (value: boolean): void {
    this.isLoadingAPIConfigs = value
  }

  @Action({ commit: 'setAPIConfigs', rawError: true })
  public async loadAPIConfigs (): Promise<APIConfig[]> {
    this.context.commit('setIsLoadingAPIConfigs', true)
    return await RestService.getAllAPIConfigs()
  }

  @Action({ commit: 'setSelectedAPIConfig', rawError: true })
  public async loadAPIConfigById (id: number): Promise<APIConfig> {
    return await RestService.getAPIConfigById(id)
  }

  @Action({ commit: 'setSelectedAPIConfig', rawError: true })
  public async loadAPIConfigByPipelineId (pipelineId: number): Promise<APIConfig> {
    return await RestService.getAPIConfigByPipelineId(pipelineId)
  }

  @Action({ commit: 'setAPIConfigs', rawError: true })
  public async createAPIConfigById (api: APIConfig): Promise<APIConfig[]> {
    console.log(api)
    await RestService.createAPIConfig(api)
    return await RestService.getAllAPIConfigs()
  }

  @Action({ commit: 'setAPIConfigs', rawError: true })
  public async createAPIConfig (api: APIConfig): Promise<APIConfig[]> {
    console.log(api)
    await RestService.createAPIConfig(api)
    return await RestService.getAllAPIConfigs()
  }

  @Action({ commit: 'setAPIConfigs', rawError: true })
  public async updateAPIConfig (api: APIConfig): Promise<APIConfig[]> {
    await RestService.updateAPIConfig(api)
    return await RestService.getAllAPIConfigs()
  }

  @Action({ commit: 'setAPIConfigs', rawError: true })
  public async deleteAPIConfig (apiId: number): Promise<APIConfig[]> {
    await RestService.deleteAPIConfig(apiId)
    return await RestService.getAllAPIConfigs()
  }

}

