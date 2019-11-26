<template>
  <div class="transformation-main">
    <v-card class="mx-auto">
      <v-card-title>Data Input</v-card-title>
      <MonacoDataProvider v-model="dataInput" />
      <v-divider class="mx-4" />

      <v-card-title>Transformation Function</v-card-title>
      <CodeEditor
        v-model="functionInput"
        :data="dataInput"
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
          Run Transformation
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'
import { Action, State } from 'vuex-class'

import JobResult from './interfaces/jobResult'
import TransformationRequest from './interfaces/transformationRequest'

import MonacoDataProvider from './MonacoDataProvider.vue'
import TextAreaDataProvider from './TextAreaDataProvider.vue'
import CodeEditor from './CodeEditor.vue'
import ResultView from './ResultView.vue'

const namespace = { namespace: 'transformation' }

@Component({
  components: {
    TextAreaDataProvider,
    MonacoDataProvider,
    CodeEditor,
    ResultView
  }
})
export default class TransformationMain extends Vue {
  private editorOptions = {
    minimap: {
      enabled: false
    }
  }

  private dataInput: object = { a: 1, b: 2, c: 3 }
  private functionInput = 'return data;'
  private timeoutHandle: number | null = null

  @State('transformationResult', namespace)
  private transformationResult!: JobResult | null

  @State('isLoadingResults', namespace)
  private isLoading!: boolean

  @Action('transformData', namespace)
  private transformData!: (request: TransformationRequest) => void

  @Watch('dataInput')
  onDataInputChanged (): void {
    this.scheduleSubmit()
  }

  @Watch('functionInput')
  onFunctionInputChanged (): void {
    this.scheduleSubmit();
  }

  private scheduleSubmit (): void {
    if (this.timeoutHandle !== null) {
      window.clearTimeout(this.timeoutHandle)
    }
    this.timeoutHandle = window.setTimeout(this.submit, 1500)
  }

  private submit (): void {
    this.transformData({ func: this.functionInput, data: this.dataInput })
  }
}
</script>
