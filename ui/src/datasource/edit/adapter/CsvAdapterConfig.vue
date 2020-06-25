<template>
  <v-form
    v-model="validForm"
  >
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
      :rules="[required]"
      :maxlength="1"
      @keyup="formChanged"
    />
    <v-select
      v-model="csvConfig.lineSeparator"
      :items="availableLineSeparators"
      label="Line separator"
      :rules="[required]"
      @change="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

type CsvConfig = {
  lineSeparator: string;
  columnSeparator: string;
  firstRowAsHeader: boolean;
  skipFirstDataRow: boolean;
}

@Component({ })
export default class CsvAdapterConfig extends Vue {
  private validForm = true;
  private availableLineSeparators = [
    { value: '\n', text: '\\n' },
    { value: '\r', text: '\\r' },
    { value: '\r\n', text: '\\r\\n' }
  ]

  @PropSync('value')
  private csvConfig!: CsvConfig;

  @Emit('value')
  emitValue (): CsvConfig {
    return this.csvConfig
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.validForm
  }

  @Emit('change')
  formChanged (): void {
    this.emitValue()
    this.emitValid()
  }

  private required (val: string): true | string {
    return !!val || 'required.'
  }
}
</script>
