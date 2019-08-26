import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import * as TransformationRest from './transformationRest'

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private transformationResult: object = {}

  @Action({ commit: 'setTransformationResult' })
  public async transformData (inputFunc: string): Promise<object> {
    return TransformationRest.transformData(inputFunc)
  }

  @Mutation private setTransformationResult (value: object): void {
    this.transformationResult = value
  }
}
