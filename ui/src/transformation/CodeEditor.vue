<template>
  <MonacoEditor
    ref="editor"
    class="codeEditor"
    v-model="code"
    v-bind:options="editorOptions"
    language="javascript"
    @editorDidMount="editorDidMount"/>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'

import MonacoEditor, { MonacoEditorConstructor, Monaco } from 'vue-monaco'
import * as monaco from 'monaco-editor'

import { Data } from './interfaces/data'

const Props = Vue.extend({
  props: {
    value: String,
    data: [Object, Array],
  }
})

@Component({
  components: {
    MonacoEditor
  }
})
export default class CodeEditor extends Props {
  public $refs!: Vue['$refs'] & {
    editor: MonacoEditorConstructor,
  }

  private editorOptions = {
    minimap: {
      enabled: false
    }
  }
  private lib: monaco.IDisposable | null = null

  get code() {
    return this.value
  }

  set code(code: string) {
    this.$emit('input', code)
  }

  setEditorJavascriptDefaults(data: Data) {
    const monaco = this.$refs.editor.monaco
    const json = JSON.stringify(data)
    const code = `let data = ${json}`
    if (this.lib !== null) this.lib.dispose()
    this.lib = monaco.languages.typescript.javascriptDefaults.addExtraLib(code)
  }

  @Watch('data')
  onDataChanged(val: Data, oldVal: Data) {
    this.setEditorJavascriptDefaults(val)
  }

  editorDidMount(editor: Monaco) {
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
</style>
