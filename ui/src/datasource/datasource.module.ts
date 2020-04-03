import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import Datasource from './datasource'
import * as RestService from './datasourceRest'

@Module({ namespaced: true })
export default class DatasourceModule extends VuexModule {
  private datasources: Datasource[] = []

  private selectedDatasource: Datasource = {} as unknown as Datasource

  private isLoadingDatasources = true

  @Mutation
  public setDatasources (datasources: Datasource[]): void {
    this.datasources = datasources
    this.isLoadingDatasources = false
  }

  @Mutation
  public setSelectedDatasource (datasource: Datasource): void {
    this.selectedDatasource = datasource
  }

  @Mutation
  public setIsLoadingDatasources (value: boolean): void {
    this.isLoadingDatasources = value
  }

  @Action({ commit: 'setDatasources', rawError: true })
  public async loadDatasources (): Promise<Datasource[]> {
    this.context.commit('setIsLoadingDatasources', true)

    return await RestService.getAllDatasources()
  }

  @Action({ commit: 'setSelectedDatasource', rawError: true })
  public async loadDatasourceById (id: number): Promise<Datasource> {
    return await RestService.getDatasourceById(id)
  }

  @Action({ commit: 'setDatasources', rawError: true })
  public async createDatasource (datasource: Datasource): Promise<Datasource[]> {
    await RestService.createDatasource(datasource)
    return RestService.getAllDatasources()
  }

  @Action({ commit: 'setDatasources', rawError: true })
  public async updateDatasource (Datasource: Datasource): Promise<Datasource[]> {
    await RestService.updateDatasource(Datasource)
    return RestService.getAllDatasources()
  }

  @Action({ commit: 'setDatasources', rawError: true })
  public async deleteDatasource (DatasourceId: number): Promise<Datasource[]> {
    await RestService.deleteDatasource(DatasourceId)
    return RestService.getAllDatasources()
  }
}
