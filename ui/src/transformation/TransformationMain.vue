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

  @State('transformationResult', namespace)
  private transformationResult!: JobResult | null

  @State('isLoadingResults', namespace)
  private isLoading!: boolean

  @Action('transformData', namespace)
  private transformData!: (request: TransformationRequest) => void

  private dataInput: object = { a: 1, b: 2, c: 3 }
  private functionInput = 'return data;'

  private submit (): void {
    this.transformData({ func: this.functionInput, data: this.dataInput })
  }
}
</script>
