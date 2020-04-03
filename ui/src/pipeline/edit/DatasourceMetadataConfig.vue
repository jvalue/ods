<template>
  <v-form
    v-model="validForm"
  >
    <v-text-field
      v-model="metadataConfig.description"
      label="Datasource Description"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="metadataConfig.author"
      label="Author"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="metadataConfig.license"
      label="License"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

import { DatasourceMetaData } from '../datasource'

@Component({ })
export default class DatasourceMetadataConfig extends Vue {
  private validForm = true;

  @PropSync('value')
  private metadataConfig!: DatasourceMetaData;

  @Emit('value')
  emitValue () {
    return this.metadataConfig
  }

  @Emit('validityChanged')
  emitValid () {
    return this.validForm
  }

  formChanged () {
    this.emitValue()
    this.emitValid()
  }
}
</script>
