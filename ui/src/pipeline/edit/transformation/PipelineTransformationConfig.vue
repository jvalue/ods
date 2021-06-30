<template>
  <v-card class="mx-auto">
    <v-card-title>Data Input</v-card-title>
    <v-progress-linear
      :active="isLoadingData"
      indeterminate
    />
    <MonacoDataProvider />
    <v-divider class="mx-4" />

    <v-card-title>Transformation Function</v-card-title>
    <CodeEditor />
    <v-divider class="mx-4" />

    <v-card-title>Transformation Results</v-card-title>
    <v-progress-linear
      :active="isLoadingResult"
      indeterminate
      bottom
    />
    <ResultView :result="result" />
    <v-divider class="mx-4" />

    <v-card-actions>
      <v-btn
        text
        color="success"
        @click="submit"
      >
        Test Transformation
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, Watch, Prop } from 'vue-property-decorator'
import { Action, State } from 'vuex-class'

import { TransformationConfig } from '../../pipeline'
import { JobResult } from './transformation'

import MonacoDataProvider from './MonacoDataProvider.vue'
import CodeEditor from './CodeEditor.vue'
import ResultView from './ResultView.vue'
import { Data } from '@/datasource/datasource'

const namespace = { namespace: 'transformation' }

@Component({
  components: {
    MonacoDataProvider,
    CodeEditor,
    ResultView
  }
})
export default class PipelineTransformationConfig extends Vue {
  @Prop() value!: TransformationConfig
  @Prop() datasourceId!: number
  @Prop() transformedData!: JobResult

  private validForm = false // function needs to be tested in order to be valid

  /** from vuex module */
  @State('data', namespace)
  private data!: Data | null

  /** from vuex module */
  @State('function', namespace)
  private function!: string

  /** from vuex module */
  @State('result', namespace)
  private result!: JobResult | null

  /** from vuex module */
  @Action('setFunctionAndSubmit', namespace)
  private setFunctionAndSubmit!: (value: string) => void

  /** from vuex module */
  @State('isLoadingResult', namespace)
  private isLoadingResult!: boolean

  /** from vuex module */
  @State('isLoadingData', namespace)
  private isLoadingData!: boolean

  /** from vuex module */
  @Action('loadDataFromDatasource', namespace)
  private loadDataFromDatasource!: (datasourceId: number) => void

  /** from vuex module */
  @Action('transformData', namespace)
  private transformData!: () => void

  @Watch('datasourceId')
  onDatasourceIdChanged (): void {
    this.loadDataFromDatasource(this.datasourceId)
  }

  created (): void {
    if (this.datasourceId !== -1) {
      this.loadDataFromDatasource(this.datasourceId)
    }
    this.setFunctionAndSubmit(this.value.func)
  }

  submit (): void {
    this.transformData()
  }

  /** emit new validity after a new transformation result comes in */
  @Watch('result')
  onResultChanged (): void {
    this.validForm = this.result?.error === undefined
    this.emitValid()
  }

  @Watch('value')
  onValueChanged (): void {
    this.setFunctionAndSubmit(this.value.func)
  }

  @Watch('function')
  onFunctionChanged (): void {
    this.emitValue()
  }

  @Emit('input')
  emitValue (): TransformationConfig {
    return { func: this.function }
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.validForm
  }
}
</script>
