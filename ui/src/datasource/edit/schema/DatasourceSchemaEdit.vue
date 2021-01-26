<template>
  <v-form
    v-model="isValid"
  >
    <v-select
      v-model="dataSchema.mode"
      :items="availableSchemaModes"
      label="Mode"
      :rules="[required]"
    />
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
import { requiredRule } from '../../../validators'
import { DataSchema } from '../../datasource'

@Component({ })
export default class DatasourceSchemaEdit extends Vue {
  private availableSchemaModes = ['NONE', 'FAST', 'DETAILED']

  private isValid = true
  private required = requiredRule
  
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
