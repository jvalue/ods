<template>
  <div>
    <v-form
      v-model="isValid"
    >
      <v-select
        v-model="adapterConfig.protocol.type"
        :items="availableAdapterProtocols"
        label="Protocol"
        :rules="[required]"
      />
      <v-text-field
        v-model="adapterConfig.protocol.parameters.location"
        label="URL"
        class="pl-7"
        :rules="[required]"
      />
      <v-select
        v-model="adapterConfig.protocol.parameters.encoding"
        :items="availableEncodings"
        label="Encoding"
        class="pl-7"
        :rules="[required]"
      />
      <v-select
        v-model="adapterConfig.format.type"
        :items="availableAdapterFormats"
        label="Format"
        :rules="[required]"
        @change="(val) => formatChanged(val)"
      />
      <csv-adapter-config
        v-if="adapterConfig.format.type === 'CSV'"
        v-model="adapterConfig.format.parameters"
        class="pl-7"
        @validityChanged="isFormatParametersValid = $event"
      />
    </v-form>
    <h2>Configuration Preview</h2>
    <v-container>
      <pre style="height: 500px; overflow: scroll; background: lightgray" class="py-3">
        {{ preview }}
      </pre>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync, Watch } from 'vue-property-decorator'

import Datasource from '../../datasource'
import CsvAdapterConfig from './CsvAdapterConfig.vue'
import { requiredRule } from '../../../validators'

import * as PreviewClient from '../../previewRest'

@Component({
  components: { CsvAdapterConfig }
})
export default class AdapterConfig extends Vue {
  private availableAdapterProtocols = ['HTTP']
  private availableEncodings = ['UTF-8', 'ISO-8859-1', 'US-ASCII']
  private availableAdapterFormats = ['JSON', 'XML', 'CSV']

  private isValid = true
  private isFormatParametersValid = true

  private preview = {}

  @PropSync('value')
  private adapterConfig!: Datasource

  private required = requiredRule

  @Emit('value')
  emitValue (): Datasource {
    return this.adapterConfig
  }

  private async updatePreview (): Promise<void> {
    const fallback = "No preview available. Datasource might not be configured right!"
    if (!this.isValid) {
      this.preview = fallback
      return
    }
    try {
      this.preview = await PreviewClient.getPreview(this.adapterConfig)
    } catch (e) {
      this.preview = fallback
    }
  }

  async created () {
    await this.updatePreview()
  }

  private formatChanged (val: string): void {
    switch (val) {
      case 'CSV': {
        this.adapterConfig.format.parameters = {
          lineSeparator: '\n',
          columnSeparator: ';',
          firstRowAsHeader: true,
          skipFirstDataRow: false
        }
        break
      }
      case 'JSON':
      case 'XML': {
        this.adapterConfig.format.parameters = {}
        this.isFormatParametersValid = true
        break
      }
    }
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.isValid && this.isFormatParametersValid
  }

  @Watch('adapterConfig', { deep: true })
  formChanged (): void {
    this.updatePreview()
    this.emitValue()
  }

  @Watch('isValid')
  isValidChanged (): void {
    this.emitValid()
  }

  @Watch('isFormatParametersValid')
  validFormParametersChanged (): void {
    this.emitValid()
  }
}
</script>
