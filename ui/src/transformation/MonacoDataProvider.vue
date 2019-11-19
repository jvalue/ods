<template>
  <div>
    <MonacoEditor
      v-model="text"
      class="jsonEditor"
      :options="editorOptions"
      language="json"
      @change="onChange"
    />
    <span
      v-if="error"
      class="red--text"
    >{{ error }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import MonacoEditor from 'vue-monaco'

import { Data } from './interfaces/data'

@Component({
  components: {
    MonacoEditor
  }
})
export default class MonacoDataProvider extends Vue {
  @Prop() readonly value!: Data

  editorOptions = {
    minimap: {
      enabled: false
    }
  }

  object = this.value
  text = this.formatJson(this.value)
  error: Error | null = null

  private formatJson (o: object): string {
    return JSON.stringify(o, null, '  ')
  }

  onChange (): void {
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
