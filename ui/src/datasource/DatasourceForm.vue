<template>
  <div v-if="!isLoading">
    <v-stepper
      v-model="dialogStep"
      vertical
    >
      <v-stepper-step
        :complete="dialogStep > 1"
        step="1"
      >
        Datasource Name
        <small>Choose a name to display the datasource</small>
      </v-stepper-step>
      <v-stepper-content step="1">
        <v-form
          v-model="validStep1"
        >
          <v-text-field
            v-model="datasource.metadata.displayName"
            label="Datasource Name"
            :rules="[required]"
          />
        </v-form>
        <stepper-button-group
          :step="1"
          :next-enabled="validStep1"
          :previous-visible="false"
          @stepChanged="dialogStep = $event"
        />
      </v-stepper-content>

      <v-stepper-step
        :complete="dialogStep > 2"
        step="2"
      >
        Adapter Configuration
        <small>Configure the data import</small>
      </v-stepper-step>
      <v-stepper-content step="2">
        <adapter-config
          v-model="datasource"
          @validityChanged="validStep2 = $event"
        />
        <stepper-button-group
          :step="2"
          :next-enabled="validStep2"
          @stepChanged="dialogStep = $event"
        />
      </v-stepper-content>

      <v-stepper-step
        :complete="dialogStep > 3"
        step="3"
      >
        Meta-Data
      </v-stepper-step>
      <v-stepper-content step="3">
        <datasource-metadata-config
          v-model="datasource.metadata"
          @validityChanged="validStep3 = $event"
        />
        <stepper-button-group
          :step="3"
          :next-enabled="validStep3"
          @stepChanged="dialogStep = $event"
        />
      </v-stepper-content>

      <v-stepper-step
        :complete="dialogStep > 4"
        step="4"
      >
        Trigger Configuration
        <small>Configure Execution Details</small>
      </v-stepper-step>
      <v-stepper-content step="4">
        <trigger-config
          v-model="datasource.trigger"
          @validityChanged="validStep4 = $event"
        />
        <stepper-button-group
          :step="4"
          :next-enabled="validStep4"
          :next-visible="false"
          @stepChanged="dialogStep = $event"
        />
      </v-stepper-content>
    </v-stepper>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Emit, PropSync, Watch } from 'vue-property-decorator'

import StepperButtonGroup from '../components/StepperButtonGroup.vue'
import AdapterConfig from './edit/adapter/AdapterConfig.vue'
import DatasourceMetadataConfig from './edit/DatasourceMetadataConfig.vue'
import TriggerConfig from './edit/TriggerConfig.vue'

import Datasource from './datasource'

@Component({
  components: { AdapterConfig, StepperButtonGroup, DatasourceMetadataConfig, TriggerConfig }
})
export default class DatasourceForm extends Vue {
  private dialogStep = 1

  private validStep1 = false
  private validStep2 = true // starts with valid default values
  private validStep3 = true // starts with valid default values
  private validStep4 = true // starts with valid default values

  @PropSync('value')
  private datasource: Datasource | undefined

  get isLoading (): boolean {
    return !this.datasource
  }

  get isValid (): boolean {
    return this.validStep1 &&
        this.validStep2 &&
        this.validStep3 &&
        this.validStep4
  }

  @Emit('validityChanged')
  private emitIsValid (): boolean {
    return this.isValid
  }

  @Watch('isValid')
  private onIsValidChanged (): void {
    this.emitIsValid()
  }

  private required (val: string): true | string {
    return !!val || 'required.'
  }
}
</script>
