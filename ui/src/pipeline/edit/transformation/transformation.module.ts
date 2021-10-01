import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';

import { JobResult, TransformationRequest } from './transformation';
import { TransformationRest } from './transformationRest';

import { Data } from '@/datasource/datasource';
import * as DatasourceRest from '@/datasource/datasourceRest';
import { PIPELINE_SERVICE_URL } from '@/env';

@Module({ namespaced: true })
export default class TransformationModule extends VuexModule {
  private data: Data | null = null;
  private function = '';
  private result: JobResult | null = null;

  private isLoadingResult = false;
  private isLoadingData = false;

  private timeoutHandle: number | null = null;

  private readonly transformationRest = new TransformationRest(
    PIPELINE_SERVICE_URL,
  );

  @Mutation setData(value: Data): void {
    this.data = value;
    this.isLoadingData = false;
  }

  // Has to be an action because of the asynchronous submit
  @Action setDataAndSubmit(value: Data): void {
    this.context.commit('setData', value);
    this.context.dispatch('scheduleSubmit').catch(() => {});
  }

  @Mutation setFunction(value: string): void {
    this.function = value;
  }

  // Has to be an action because of the asynchronous submit
  @Action setFunctionAndSubmit(value: string): void {
    this.context.commit('setFunction', value);
    this.context.dispatch('scheduleSubmit').catch(() => {});
  }

  @Mutation setResult(value: JobResult): void {
    this.result = value;
    this.isLoadingResult = false;
  }

  @Mutation setIsLoadingResult(value: boolean): void {
    this.isLoadingResult = value;
  }

  @Mutation setIsLoadingData(value: boolean): void {
    this.isLoadingData = value;
  }

  @Mutation private setTimeoutHandle(value: number): void {
    this.timeoutHandle = value;
  }

  @Action
  async loadDataFromDatasource(datasourceId: number): Promise<void> {
    this.context.commit('setIsLoadingData', true);
    const data = await DatasourceRest.getDatasourceData(datasourceId);
    this.context.dispatch('setDataAndSubmit', data).catch(() => {});
  }

  @Action
  scheduleSubmit(): void {
    // If there is another submit schedule, abort it
    if (this.timeoutHandle != null) {
      window.clearTimeout(this.timeoutHandle);
    }
    // Schedule the dispatch and get the handle
    const handle = window.setTimeout(() => {
      this.context.dispatch('transformData').catch(() => {});
    }, 1500);
    // Save the handle in the module state
    this.context.commit('setTimeoutHandle', handle);
  }

  @Action
  async transformData(): Promise<void> {
    if (this.data == null) {
      return;
    }
    this.context.commit('setIsLoadingResult', true);
    // Reset timeout handle
    this.context.commit('setTimeoutHandle', null);
    const request: TransformationRequest = {
      data: this.data,
      func: this.function,
    };
    const result = await this.transformationRest.transformData(request);
    // Save the result in the module state
    this.context.commit('setResult', result);
  }
}
