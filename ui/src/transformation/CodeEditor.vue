<template>
  <MonacoEditor
    class="codeEditor"
    v-model="code"
    v-bind:options="editorOptions"
    language="javascript" />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import MonacoEditor from 'vue-monaco'

const Props = Vue.extend({
  props: {
    value: String
  }
})

@Component({
  components: {
    MonacoEditor
  }
})
export default class CodeEditor extends Props {
  editorOptions = {
    minimap: {
      enabled: false
    }
  }
  get code() {
    return this.value
  }

  set code(code: string) {
    this.$emit('input', code)
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
