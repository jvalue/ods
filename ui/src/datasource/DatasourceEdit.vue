<template>
  <div class="pipeline-edit">
    <v-card class="mx-auto">
      <v-toolbar
        dense
        class="elevation-0"
      >
        <v-toolbar-title>
          <span v-if="isEditMode">Update Datasource: {{ dialogDatasource.id }}</span>
          <span v-else>Create new Datasource</span>
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
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
                v-model="dialogDatasource.metadata.displayName"
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
              v-model="dialogDatasource"
              :is-edit-mode="isEditMode"
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
              v-model="dialogDatasource.metadata"
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
              v-model="dialogDatasource.trigger"
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
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          class="ma-2"
          @click="onCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="isEditMode"
          :disabled="!evaluateAllForms()"
          color="primary"
          class="ma-2"
          @click="onUpdate"
        >
          Update
        </v-btn>
        <v-btn
          v-else
          :disabled="!evaluateAllForms()"
          color="primary"
          class="ma-2"
          @click="onSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'
import { Action, State } from 'vuex-class'

import AdapterConfig from './edit/adapter/AdapterConfig.vue'
import StepperButtonGroup from '../components/StepperButtonGroup.vue'
import DatasourceMetadataConfig from './edit/DatasourceMetadataConfig.vue'
import TriggerConfig from './edit/TriggerConfig.vue'
import Datasource from './datasource'

const datasourceNamespace = { namespace: 'datasource' }

@Component({
  components: { AdapterConfig, StepperButtonGroup, DatasourceMetadataConfig, TriggerConfig }
})
export default class DatasourceEdit extends Vue {
  @Action('loadDatasourceById', datasourceNamespace) private loadDatasourceByIdAction!: (id: number) => void
  @Action('createDatasource', datasourceNamespace) private createDatasourceAction!: (d: Datasource) => void
  @Action('updateDatasource', datasourceNamespace) private updateDatsourceAction!: (d: Datasource) => void
  @State('selectedDatasource', datasourceNamespace) private selectedDatasource!: Datasource

  private isEditMode = false

  private dialogStep = 1

  private validStep1 = false
  private validStep2 = true // starts with valid default values
  private validStep3 = true // starts with valid default values
  private validStep4 = true // starts with valid default values

  private dialogDatasource: Datasource = {
    id: -1,
    protocol: {
      type: 'HTTP',
      parameters: {
        location:
          'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
        encoding: 'UTF-8'
      }
    },
    format: {
      type: 'JSON',
      parameters: {}
    },
    metadata: {
      author: '',
      license: '',
      description: '',
      displayName: ''
    },
    trigger: {
      periodic: true,
      firstExecution: new Date(Date.now() + 600000),
      interval: 60000
    }
  }

  created (): void {
    this.isEditMode = this.$route.meta.isEditMode

    if (this.isEditMode) {
      const id = parseInt(this.$route.params.datasourceId)
      this.loadDatasourceByIdAction(id)
    }
  }

  @Watch('selectedDatasource')
  onSelectedDatasourceChange (value: Datasource, oldValue: Datasource): void {
    if (value !== oldValue) {
      this.dialogDatasource = value
    }
  }

  private onSave (): void {
    this.createDatasourceAction(this.dialogDatasource)
    this.routeToOverview()
  }

  private onUpdate (): void {
    this.updateDatsourceAction(this.dialogDatasource)
    this.routeToOverview()
  }

  private onCancel (): void {
    this.routeToOverview()
  }

  private routeToOverview (): void {
    this.$router.push({ name: 'datasource-overview' })
  }

  private required (val: string): true | string {
    return !!val || 'required.'
  }

  private evaluateAllForms (): boolean {
    return this.validStep1 &&
        this.validStep2 &&
        this.validStep3 &&
        this.validStep4
  }
}
</script>
