<template>
  <div class="pipeline-edit">
    <v-card class="mx-auto">
      <v-toolbar
        dense
        class="elevation-0"
      >
        <v-toolbar-title>
          <span v-if="isEditMode">Update API Config {{ dialogAPIConfig.id }}</span>
          <span v-else>Create new API Config for Pipeline {{ dialogAPIConfig.pipelineId }}</span>
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
            API Name
            <small>Choose a name to display the API</small>
          </v-stepper-step>
          <v-stepper-content step="1">
            <v-form
              v-model="validStep1"
            >
              <v-text-field
                v-model="dialogAPIConfig.displayName"
                label="API Config Name"
                :rules="[required]"
              />
              <v-text-field
                v-model.number="dialogAPIConfig.pipelineId"
                label="Referenced Pipeline Id"
                :rules="[required]"
                :readonly="isPipelinePreselected"
                type="number"
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
            API
            <small>Manage public GraphQL APIs</small>
          </v-stepper-step>
          <v-stepper-content step="2">
            <v-form
              v-model="validForm"
            >
              <v-checkbox
                v-model="dialogAPIConfig.defaultAPI"
                label="Default API"
              />
            </v-form>
            <remote-schemas-overview
              v-model="dialogAPIConfig.remoteSchemata"
              @validityChanged="validStep2 = $event"
              @value="(value) => this.dialogAPIConfig.remoteSchemata = value"
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

import APIConfig from '@/api/api'
import StepperButtonGroup from '@/components/StepperButtonGroup.vue'
import RemoteSchemasOverview from '@/api/RemoteSchemasOverview.vue'

const apiConfigNamespace = { namespace: 'apiConfig' }

@Component({
  components: { RemoteSchemasOverview, StepperButtonGroup }
})
export default class APIConfigurationEdit extends Vue {
  @Action('loadAPIConfigById', apiConfigNamespace) private loadAPIConfigByIdAction!: (id: number) => void
  @Action('createAPIConfig', apiConfigNamespace) private createAPIConfigAction!: (p: APIConfig) => void
  @Action('updateAPIConfig', apiConfigNamespace) private updateAPIConfigAction!: (p: APIConfig) => void
  @State('selectedAPIConfig', apiConfigNamespace) private selectedAPIConfig!: APIConfig

  private isEditMode = false
  private isPipelinePreselected = false

  private dialogStep = 1

  private validStep1 = false
  private validStep2 = true

  private dialogAPIConfig: APIConfig = {
    id: -1,
    pipelineId: -1,
    displayName: 'Example API Config',
    defaultAPI: true,
    remoteSchemata: [
      {
        id: 1,
        endpoint: 'http://api.example.com',
        author: 'John'
      },
      {
        id: 2,
        endpoint: 'http://api.example.io',
        author: 'Long'
      }
    ]
  }

  created (): void {
    this.isEditMode = this.$route.meta.isEditMode

    if (this.isEditMode) {
      const id = parseInt(this.$route.params.apiConfigId)
      this.loadAPIConfigByIdAction(id)
    } else {
      const pipelineId = this.$route.params.pipelineId
      if (pipelineId) {
        this.isPipelinePreselected = true
        this.dialogAPIConfig.pipelineId = parseInt(pipelineId)
      }
    }
  }

  @Watch('selectedAPIConfig')
  onSelectedAPIConfigChange (value: APIConfig, oldValue: APIConfig): void {
    if (value !== oldValue) {
      this.dialogAPIConfig = value
    }
  }

  private onSave (): void {
    console.log('here')
    this.createAPIConfigAction(this.dialogAPIConfig)
    this.routeToOverview()
  }

  private onUpdate (): void {
    this.updateAPIConfigAction(this.dialogAPIConfig)
    this.routeToOverview()
  }

  private onCancel (): void {
    this.routeToOverview()
  }

  private routeToOverview (): void {
    this.$router.push({ name: 'api-config-overview' })
  }

  private required (val: string): boolean | string {
    return !!val || 'required.'
  }

  private evaluateAllForms (): boolean {
    return this.validStep1 &&
        this.validStep2
  }
}
</script>
