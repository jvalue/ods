import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import * as StorageRestService from './storageRest'
import { StorageItem } from '@/storage/storage-item';

@Module({ namespaced: true })
export default class StorageModule extends VuexModule {
  private data: StorageItem[] = []

  @Action({ commit: 'setData' })
  public async fetchData (storageId: string): Promise<StorageItem[]> {
    try {
      return await StorageRestService.getData(storageId)
    } catch (e) {
      return Promise.resolve([])
    }
  }
  
  @Mutation private setData (data: StorageItem[]): void {
    this.data = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
}
