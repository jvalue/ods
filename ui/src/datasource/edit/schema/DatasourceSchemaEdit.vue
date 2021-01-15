<template>
  <v-form
    v-model="isValid"
  >
    <v-textarea
      v-model="dataSchema.schema"
      label="Datasource schema suggestion"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

import { DataSchema } from '../../datasource'

@Component({ })
export default class DatasourceSchemaEdit extends Vue {
  private isValid = true

  @PropSync('value')
  private dataSchema!: DataSchema

  @Emit('value')
  emitValue (): DataSchema {
    return this.dataSchema
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.isValid
  }

  formChanged (): void {
    this.emitValue()
    this.emitValid()
  }
}
</script>
