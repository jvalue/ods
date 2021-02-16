<template>
  <v-form
    v-model="isValid"
  >
    <v-card-actions>
      <v-select
        v-model="dataSource.mode"
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
      v-model="dataSource.dataSchema.data"
      label="Datasource schema suggestion"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as SchemaSuggestionREST from './../../schemaSuggestionRest'

import { Emit, PropSync } from 'vue-property-decorator'
import { requiredRule } from '../../../validators'
import DataSource, { Mode } from '../../datasource'

@Component({ })
export default class DatasourceSchemaEdit extends Vue {
  private availableSchemaModes = [Mode.NONE, Mode.FAST, Mode.DETAILED]

  private isValid = true
  private required = requiredRule
  
  @PropSync('value')
  private dataSource!: DataSource

  @Emit('value')
  emitValue (): DataSource {
    return this.dataSource
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
    if (this.dataSource.mode == Mode.NONE)
      return
    else if (this.dataSource.mode == Mode.FAST) {
      SchemaSuggestionREST.getSchemaFast(this.dataSource.dataSchema)
        .then((value) => {
          this.dataSource.dataSchema.data = value
        })
        .catch(error => console.error('Fast schema suggestion failed!', error))
    } else if (this.dataSource.mode == Mode.DETAILED) {
      SchemaSuggestionREST.getSchemaDetailed(this.dataSource.dataSchema)
        .then((value) => {
          this.dataSource.dataSchema.data = value
        })
        .catch(error => console.error('Detailed schema suggestion failed!', error))
    }
  }
}
</script>
