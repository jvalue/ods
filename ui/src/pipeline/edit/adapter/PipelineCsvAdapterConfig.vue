<template>
  <div>
    <v-switch
      v-model="csvConfig.firstRowAsHeader"
      label="Use first row as header"
      @change="formChanged"
    />
    <v-switch
      v-model="csvConfig.skipFirstDataRow"
      label="Skip the first data row (after header if selected)"
      @change="formChanged"
    />
    <v-text-field
      v-model="csvConfig.columnSeparator"
      label="Column separator"
      :rules="[required, validateColumnSeparator]"
      @keyup="formChanged"
    />
    <v-text-field
      v-model="csvConfig.lineSeparator"
      label="Line separator"
      :rules="[required, validateLineSeparator]"
      @keyup="formChanged"
    />
  </div>
</template>


<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

class CsvConfig {
  lineSeparator: string;
  columnSeparator: string;
  firstRowAsHeader: boolean;
  skipFirstDataRow: boolean;
}

@Component({ })
export default class PipelineCsvAdapterConfig extends Vue {

  private validForm: boolean = true;

  @PropSync('value')
  private csvConfig!: CsvConfig;

  @Emit("value")
  emitValue() {
    return this.csvConfig;
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

  private validateLineSeparator (val: string) {
    return !!val && (val === '\n' || val === '\r' || val === '\r\n')
  }

  private validateColumnSeparator (val: string) {
    return !!val && val.length == 1
  }
}
</script>
