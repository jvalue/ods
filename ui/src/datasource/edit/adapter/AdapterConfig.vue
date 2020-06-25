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
      v-model="adapterConfig.protocol.parameters.encoding"
      :items="availableEncodings"
      label="Encoding"
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
    <csv-adapter-config
      v-if="adapterConfig.format.type === 'CSV'"
      v-model="adapterConfig.format.parameters"
      class="pl-7"
      @validityChanged="validFormatParameters = $event"
      @change="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, Prop, PropSync, Watch } from 'vue-property-decorator'

import Datasource from '../../datasource'
import CsvAdapterConfig from './CsvAdapterConfig.vue'

@Component({
  components: { CsvAdapterConfig }
})
export default class AdapterConfig extends Vue {
  private availableAdapterProtocols = ['HTTP']
  private availableEncodings = ['UTF-8', 'ISO-8859-1', 'US-ASCII']
  private availableAdapterFormats = ['JSON', 'XML', 'CSV']

  private validForm = true;
  private validFormatParameters = true;

  @Prop(Boolean)
  private isEditMode!: boolean

  @PropSync('value')
  private adapterConfig!: Datasource;

  @Emit('value')
  emitValue (): Datasource {
    return this.adapterConfig
  }

  @Watch('adapterConfig.format.type')
  private formatChanged (val: string): void {
    switch (val) {
      case 'CSV': {
        if (!this.isEditMode) { // otherwise csv params don't need reassignment of default values
          this.adapterConfig.format.parameters = {
            lineSeparator: '\n',
            columnSeparator: ';',
            firstRowAsHeader: true,
            skipFirstDataRow: false
          }
        }
        break
      } case 'JSON' || 'XML': {
        this.adapterConfig.format.parameters = {}
        this.validFormatParameters = true
        break
      }
    }
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.validForm && this.validFormatParameters
  }

  formChanged (): void {
    this.emitValue()
    this.emitValid()
  }

  private required (val: string): true | string {
    return !!val || 'required.'
  }
}
</script>
