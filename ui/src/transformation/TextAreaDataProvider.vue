<template>
  <v-form>
    <v-textarea
      v-model="text"
      full-width
      @change="onChange"
    />
    <span
      v-if="error"
      class="red--text"
    >{{ error }}</span>
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component({})
export default class TextAreaDataProvider extends Vue {
  @Prop() readonly value!: object

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
      this.text = this.formatJson(newObject)
      this.error = null
      this.$emit('input', newObject)
    } catch (error) {
      this.error = error
    }
  }
}
</script>
