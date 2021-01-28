<template>
  <v-form
    v-model="isValid"
  >
    <v-card-actions>
      <v-select
        v-model="dataSchema.mode"
        :items="availableSchemaModes"
        label="Mode"
        :rules="[required]"
      />
      <v-btn
        color="primary"
        class="ma-2"
        @click="onGenerate"
      >
        Generate
      </v-btn>
    </v-card-actions>
    <v-textarea
      v-model="dataSchema.data"
      label="Datasource schema suggestion"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as DatasourceREST from './../../datasourceRest'

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

  private onGenerate (): void {
    if (this.dataSchema.mode == 'NONE')
      return
    else if (this.dataSchema.mode == 'FAST') {
      DatasourceREST.getSchemaFast(this.dataSchema)
        .then((value) => {
          this.dataSchema.data = value
          console.log(value)
        })
        .catch(error => console.error('Failed to create datasource', error))
    } else if (this.dataSchema.mode == 'DETAILED') {
      DatasourceREST.getSchemaDetailed(this.dataSchema)
        .then((value) => {
          this.dataSchema.data = value
          console.log(value)
        })
        .catch(error => console.error('Failed to create datasource', error))
    }
  }
}
</script>
