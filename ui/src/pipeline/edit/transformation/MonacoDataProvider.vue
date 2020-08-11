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
import { Prop, Watch } from 'vue-property-decorator'

import MonacoEditor from 'vue-monaco'
import { Mutation, State, Action } from 'vuex-class'

const namespace = { namespace: 'transformation' }

@Component({
  components: {
    MonacoEditor
  }
})
export default class MonacoDataProvider extends Vue {
  private editorOptions = {
    minimap: {
      enabled: false
    }
  }

  /** from vuex module */
  @State('data', namespace)
  private data!: any | null

  /** from vuex module */
  @Action('setDataAndSubmit', namespace)
  private setDataAndSubmit!: (value: any) => void

  /** displayed in the monaco instance */
  text = ''

  /** JSON parsing errors*/
  error: Error | null = null

  private formatJson (o: object): string {
    return JSON.stringify(o, null, '  ')
  }

  @Watch('data')
  onDataChange (): void {
    console.log('data change')
    this.text = this.formatJson(this.data)
  }

  onChange (): void {
    try {
      const newObject = JSON.parse(this.text)
      this.setDataAndSubmit(newObject)
      // this.text = this.formatJson(newObject) // TODO: improve automatic formatting
      this.error = null
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
