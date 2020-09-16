import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import * as StorageRest from './storageRest'
import { StorageItem } from '@/storage/storage-item'

@Module({ namespaced: true })
export default class StorageModule extends VuexModule {
  private data: StorageItem[] = []

  @Action({ commit: 'setData' })
  public async fetchData (pipelineId: string): Promise<StorageItem[]> {
    try {
      return await StorageRest.getStoredItems(pipelineId)
    } catch (e) {
      return []
    }
  }

  @Mutation private setData (data: StorageItem[]): void {
    this.data = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
}
