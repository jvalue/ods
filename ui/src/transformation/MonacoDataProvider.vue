<template>
  <div>
    <MonacoEditor
      class="jsonEditor"
      v-model="text"
      v-bind:options="editorOptions"
      v-on:change="onChange"
      language="json" />
    <span v-if="error" class="red--text">{{error}}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import MonacoEditor from 'vue-monaco'

const Props = Vue.extend({
  props: {
    value: Object
  }
})

@Component({
  components: {
    MonacoEditor
  }
})
export default class MonacoDataProvider extends Props {
  editorOptions = {
    minimap: {
      enabled: false
    }
  }

  object = this.value
  text = this.formatJson(this.value)
  error: Error | null = null

  private formatJson(o: object): string {
    return JSON.stringify(o, null, '  ')
  }

  onChange(value: string) {
    try {
      const newObject = JSON.parse(this.text)
      this.object = newObject
      // this.text = this.formatJson(newObject) // TODO: improve automatic formatting
      this.error = null
      this.$emit('input', newObject)
    } catch (error) {
      this.error = error
    }
  }
}
</script>

<style>
.jsonEditor {
  height: 150px;
  width: 100%;
  text-align: left;
}
</style>
