<template>
  <v-form v-model="validForm">
    <v-text-field
      v-model="metadataConfig.description"
      label="Pipeline Description"
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
import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, PropSync } from 'vue-property-decorator';

import { PipelineMetaData } from '../pipeline';

@Component({})
export default class PipelineMetadataConfig extends Vue {
  private validForm = true;

  @PropSync('value')
  private metadataConfig!: PipelineMetaData;

  @Emit('value')
  emitValue(): PipelineMetaData {
    return this.metadataConfig;
  }

  @Emit('validityChanged')
  emitValid(): boolean {
    return this.validForm;
  }

  formChanged(): void {
    this.emitValue();
    this.emitValid();
  }
}
</script>
