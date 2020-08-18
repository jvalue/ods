<template>
  <MonacoEditor
    ref="editor"
    v-model="code"
    class="codeEditor"
    :options="editorOptions"
    language="javascript"
    @editorDidMount="editorDidMount"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'

import MonacoEditor, { MonacoEditorConstructor } from 'vue-monaco'
import * as monaco from 'monaco-editor'

import { JobResult, JobError } from './transformation'
import { Action, State } from 'vuex-class'
import { Data } from '../../../datasource/datasource'

const namespace = { namespace: 'transformation' }

@Component({
  components: {
    MonacoEditor
  }
})
export default class CodeEditor extends Vue {
  /** from vuex module */
  @Action('data', namespace)
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

  private get code (): string {
    return this.function
  }

  private set code (value: string) {
    this.setFunctionAndSubmit(value)
  }

  public $refs!: Vue['$refs'] & {
    editor: MonacoEditorConstructor;
  }

  private editorOptions = {
    minimap: {
      enabled: false
    }
  }

  private lib: monaco.IDisposable | null = null
  private decorations: string[] = []

  /**
   * Set autocomplete details for the data object
   * @param {Data} data the example data
   * @returns {void}
   */
  setEditorJavascriptDefaults (data: object): void {
    const monaco = this.$refs.editor.monaco
    const json = JSON.stringify(data)
    const code = `let data = ${json}`
    if (this.lib !== null) this.lib.dispose()
    this.lib = monaco.languages.typescript.javascriptDefaults.addExtraLib(code)
  }

  /**
   * Buils the range that gets highlighted from an error.
   * The whole line from the specified position until the end gets highlighted.
   * For MissingReturnErrors, the last line in the code gets highlighted.
   * @param {JobError} error the specified error
   * @returns {monaco.Range} the range to be highlighted
   */
  private buildRange (error: JobError): monaco.Range {
    const lines: string[] = this.code.split('\n')

    let lineNumber: number
    if (error.name === 'MissingReturnError') {
      lineNumber = lines.length
    } else {
      lineNumber = error.lineNumber
    }
    const endPosition: number = lines[lineNumber - 1].length

    return new monaco.Range(lineNumber, error.position, lineNumber, endPosition)
  }

  /**
   * Builds a decoration (graphical element to be displayed in the editor) out of a JobError.
   * Uses the provided code position to underline the erroring section in red and
   * adds a small marker to the line number bar.
   * @param {JobError | undefined} error the error from the JobResult
   * @returns {monaco.editor.IModelDeltaDecoration[]} a list of decorations (normally 0 or 1 entries)
   */
  private buildDecorations (error: JobError | undefined): monaco.editor.IModelDeltaDecoration[] {
    if (error === undefined) {
      return []
    }

    const range = this.buildRange(error)

    const hoverMessage: monaco.IMarkdownString[] = [
      { value: `**${error.name}**` },
      { value: `${error.message}` },
      { value: error.stacktrace.join('\n') }
    ]

    return [{
      range,
      options: {
        inlineClassName: 'javascriptErrorInline',
        linesDecorationsClassName: 'javascriptErrorLine',
        hoverMessage
      }
    }]
  }

  /**
   * Displays the provided error in the monaco editor instance.
   * It keeps track of the previous decorations and uses deltaDecorations to limit the number of operations.
   * @param {JobError | undefined} error the provided error
   */
  private displayError (error: JobError | undefined): void {
    const editor = this.$refs.editor.getEditor()

    const newDecorations = this.buildDecorations(error)

    this.decorations = editor.deltaDecorations(this.decorations, newDecorations)
  }

  @Watch('data')
  onDataChanged (val: object): void {
    this.setEditorJavascriptDefaults(val)
  }

  @Watch('result')
  onResultChanged (val: JobResult): void {
    this.displayError(val.error)
  }

  editorDidMount (): void {
    if (this.data === null) return
    this.setEditorJavascriptDefaults(this.data)
  }
}
</script>

<style>
.codeEditor {
  height: 150px;
  width: 100%;
  text-align: left;
}

.javascriptErrorInline {
  text-decoration: underline;
  text-decoration-color: red;
  text-decoration-style: dotted;
  text-decoration-skip-ink: none;
}

.javascriptErrorLine {
  background-color:red;
  width: 5px !important;
  margin-left: 3px;
}
</style>
