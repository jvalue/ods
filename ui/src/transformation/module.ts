import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import * as TransformationRestService from './transformationRest'

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private transformationResult: object = {}

  @Action({ commit: 'setTransformationResult' })
  // TODO: remove if possible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async transformData (inputFunc: string): Promise<any> {
    return TransformationRestService.transformData(inputFunc)
  }

  @Mutation private setTransformationResult (value: object): void {
    this.transformationResult = value
  }
}
