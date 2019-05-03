import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
import * as TransformationRestService from './transformationRest';

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private transformationResult: object = {};

  @Action({ commit: 'setTransformationResult' })
  public async transformData(inputFunc: string) {
    return await TransformationRestService.transformData(inputFunc);
  }

  @Mutation private setTransformationResult(value: object) {
    this.transformationResult = value;
  }
}
