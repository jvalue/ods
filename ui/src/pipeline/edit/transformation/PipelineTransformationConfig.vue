<template>
  <v-card class="mx-auto">
    <v-card-title>Data Input</v-card-title>
    <MonacoDataProvider v-model="data" />
    <v-divider class="mx-4" />

    <v-card-title>Transformation Function</v-card-title>
    <CodeEditor
      v-model="func"
      :data="data"
      :result="transformationResult"
    />
    <v-divider class="mx-4" />

    <v-card-title>Transformation Results</v-card-title>
    <v-progress-linear
      :active="isLoading"
      indeterminate
      bottom
    />
    <ResultView :result="transformationResult" />
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
import Vue, { PropType } from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync, Watch } from 'vue-property-decorator'
import { Action, State } from 'vuex-class'

import { TransformationConfig } from '../../pipeline'
import { JobResult, TransformationRequest } from './transformation'

import MonacoDataProvider from './MonacoDataProvider.vue'
import CodeEditor from './CodeEditor.vue'
import ResultView from './ResultView.vue'

const namespace = { namespace: 'transformation' }

const Props = Vue.extend({
  props: {
    value: Object as PropType<TransformationConfig>
  }
})

@Component({
  components: {
    MonacoDataProvider,
    CodeEditor,
    ResultView
  }
})
export default class PipelineTransformationConfig extends Props {
  private data: object = { a: 1, b: 2, c: 3 }
  private timeoutHandle: number | null = null
  private validForm = false // function needs to be tested in order to be valid

  /** from vuex module */
  @State('transformationResult', namespace)
  private transformationResult!: JobResult | null

  /** from vuex module */
  @State('isLoadingResults', namespace)
  private isLoading!: boolean

  /** from vuex module */
  @Action('transformData', namespace)
  private transformData!: (request: TransformationRequest) => void

  /** local property wrapping v-model (value) in order to watch for changes */
  private get func (): string {
    return this.value.func
  }

  /** code editor changes function => emit and schedule submit */
  private set func (func: string) {
    this.value.func = func
    this.emitValue()
    this.scheduleSubmit()
  }

  /** schedule submit if example data is changed */
  @Watch('data')
  onDataInputChanged (): void {
    this.scheduleSubmit()
  }

  /** submit instantly when v-model (value) gets changed, e.g. by loading the edit pipeline view */
  @Watch('value')
  onValueChanged (): void {
    this.submit()
  }

  /** emit new validity after a new transformation result comes in */
  @Watch('transformationResult')
  onTransformationResultChanged (): void {
    this.validForm = this.transformationResult?.error === undefined;
    this.emitValid();
  }

  /** wait 1.5s until automatically starting a test run, remove old schedule if necessary */
  private scheduleSubmit (): void {
    if (this.timeoutHandle !== null) {
      window.clearTimeout(this.timeoutHandle)
    }
    this.timeoutHandle = window.setTimeout(this.submit, 1500)
  }

  private submit (): void {
    this.transformData({ func: this.value.func, data: this.data })
  }

  @Emit('input')
  emitValue () {
    return this.value
  }

  @Emit('validityChanged')
  emitValid () {
    return this.validForm
  }
}
</script>
