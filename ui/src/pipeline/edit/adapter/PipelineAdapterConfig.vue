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
    <v-text-field
      v-model="adapterConfig.protocol.parameters.location"
      label="URL"
      class="pl-7"
      :rules="[required]"
      @keyup="formChanged"
    />
    <v-select
      v-model="adapterConfig.format.type"
      :items="availableAdapterFormats"
      label="Format"
      :rules="[required]"
      @change="formChanged"
    />
    <pipeline-csv-adapter-config
      v-if="adapterConfig.format.type === 'CSV'"
      v-model="adapterConfig.format.parameters"
      v-on:validityChanged="validFormatParameters = $event"
      class="pl-7"
    />
  </v-form>
</template>


<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

import { AdapterConfig } from '../../pipeline'
import PipelineCsvAdapterConfig from './PipelineCsvAdapterConfig.vue'

@Component({
  components: { PipelineCsvAdapterConfig }
})
export default class PipelineAdapterConfig extends Vue {

  private availableAdapterProtocols = ['HTTP']
  private availableAdapterFormats = ['JSON', 'XML', 'CSV']

  private validForm: boolean = true;
  private validFormatParameters: boolean = true;


  @PropSync('value')
  private adapterConfig!: AdapterConfig;

  @Emit("value")
  emitValue() {
    return this.adapterConfig;
  }

  @Emit("validityChanged")
  emitValid() {
    return this.validForm && this.validFormatParameters
  }

  formChanged() {
    if(this.adapterConfig.format.type === 'CSV') {
      this.adapterConfig.format.parameters = {
        lineSeparator: '\n',
        columnSeparator: ';',
        firstRowAsHeader: true,
        skipFirstDataRow: false
      }
    } else {
      this.adapterConfig.format.parameters = {}
      this.validFormatParameters = true;
    }

    this.emitValue();
    this.emitValid();
  }

  private required (val: string) {
    return !!val || 'required.'
  }
}
</script>
