<template>
  <v-form
    v-model="isValid"
  >
    <v-card-actions>
      <v-btn
        color="primary"
        class="ma-2"
        @click="onGenerateFast"
      >
        Generate fast
      </v-btn>
      <v-btn
        color="primary"
        class="ma-2"
        @click="onGenerateDetailed"
      >
        Generate detailed
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
import DataSource from '../../datasource'

@Component({ })
export default class DatasourceSchemaEdit extends Vue {

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

  private async onGenerateFast (): Promise<void> {
    this.dataSource.dataSchema.data = await SchemaSuggestionREST.getSchemaFast(this.dataSource.dataSchema)
  }

  private async onGenerateDetailed (): Promise<void> {   
    this.dataSource.dataSchema.data = await SchemaSuggestionREST.getSchemaDetailed(this.dataSource.dataSchema)
  }
}
</script>
