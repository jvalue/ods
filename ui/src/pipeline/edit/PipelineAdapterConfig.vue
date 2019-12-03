<template>
  <v-form
    v-model="validForm"
  >
    <v-select
      v-model="adapterConfig.protocol.type"
      :items="availableAdapterProtocols"
      label="Protocol"
      :rules="[required]"
      @change="formChanged"
    />
    <v-select
      v-model="adapterConfig.format.type"
      :items="availableAdapterFormats"
      label="Format"
      :rules="[required]"
      @change="formChanged"
    />
    <v-text-field
      v-model="adapterConfig.protocol.parameters.location"
      label="URL"
      :rules="[required]"
      @keyup="formChanged"
    />
  </v-form>
</template>


<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

import { AdapterConfig } from '../pipeline'

@Component({ })
export default class PipelineAdapterConfig extends Vue {

  private availableAdapterProtocols = ['HTTP']
  private availableAdapterFormats = ['JSON', 'XML']

  private validForm: boolean = true;


  @PropSync('value')
  private adapterConfig!: AdapterConfig;

  @Emit("value")
  emitValue() {
    return this.adapterConfig;
  }

  @Emit("validityChanged")
  emitValid() {
    return this.validForm;
  }

  formChanged() {
    this.emitValue();
    this.emitValid();
  }

  private required (val: string) {
    return !!val || 'required.'
  }
}
</script>
