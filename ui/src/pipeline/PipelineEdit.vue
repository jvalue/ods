<template>
  <div class="pipeline-edit">
    <v-card class="mx-auto">
      <v-toolbar
        dense
        class="elevation-0"
      >
        <v-toolbar-title>
          <span v-if="isEditMode">Update Pipeline with id: {{ dialogPipeline.id }}</span>
          <span v-else>Create new Pipeline</span>
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
            Pipeline Name
            <small>Choose a name to display the pipeline</small>
          </v-stepper-step>
          <v-stepper-content step="1">
            <v-form
              v-model="validStep1"
            >
              <v-text-field
                v-model="dialogPipeline.metadata.displayName"
                label="Pipeline Name"
                :rules="[required]"
              />
            </v-form>
            <pipeline-edit-stepper-button-group v-bind:step="1" v-bind:nextEnabled="validStep1" v-bind:previousVisible="false" v-on:stepChanged="dialogStep = $event" />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 2"
            step="2"
          >
            Adapter Configuration
            <small>Configure the data import</small>
          </v-stepper-step>
          <v-stepper-content step="2">
            <pipeline-adapter-config v-model="dialogPipeline.adapter" v-on:validityChanged="validStep2 = $event" />
            <pipeline-edit-stepper-button-group v-bind:step="2" v-bind:nextEnabled="validStep2" v-on:stepChanged="dialogStep = $event" />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 3"
            step="3"
          >
            Transformations
            <small>Customize data transformations</small>
          </v-stepper-step>
          <v-stepper-content step="3">
              <pipeline-transformation-config v-model="dialogPipeline.transformations" v-on:validityChanged="validStep3 = $event"/>
              <pipeline-edit-stepper-button-group v-bind:step="3" v-bind:nextEnabled="validStep3" v-on:stepChanged="dialogStep = $event" />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 4"
            step="4"
          >
            Meta-Data
          </v-stepper-step>
          <v-stepper-content step="4">
            <pipeline-metadata-config v-model="dialogPipeline.metadata" v-on:validityChanged="validStep4 = $event"/>
            <pipeline-edit-stepper-button-group v-bind:step="4" v-bind:nextEnabled="validStep4" v-on:stepChanged="dialogStep = $event" />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 5"
            step="5"
          >
            Trigger Configuration
            <small>Configure Execution Details</small>
          </v-stepper-step>
          <v-stepper-content step="5">
            <pipeline-trigger-config v-model="dialogPipeline.trigger" v-on:validityChanged="validStep5 = $event" />
            <pipeline-edit-stepper-button-group v-bind:step="5" v-bind:nextEnabled="validStep5" v-bind:nextVisible="false" v-on:stepChanged="dialogStep = $event" />
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
import Pipeline from './pipeline'

import PipelineAdapterConfig from './edit/PipelineAdapterConfig.vue'
import PipelineEditStepperButtonGroup from './edit/PipelineEditStepperButtonGroup.vue'
import PipelineMetadataConfig from './edit/PipelineMetadataConfig.vue'
import PipelineTransformationConfig from './edit/PipelineTransformationConfig.vue'
import PipelineTriggerConfig from './edit/PipelineTriggerConfig.vue'


const namespace = { namespace: 'pipeline' }

@Component({
  components: { PipelineAdapterConfig, PipelineEditStepperButtonGroup, PipelineMetadataConfig, PipelineTransformationConfig, PipelineTriggerConfig }
})
export default class PipelineEdit extends Vue {
  @Action('loadPipelineById', namespace) private loadPipelineByIdAction!: (
    id: number
  ) => void

  @Action('createPipeline', namespace) private createPipelineAction!: (
    p: Pipeline
  ) => void

  @Action('updatePipeline', namespace) private updatePipelineAction!: (
    p: Pipeline
  ) => void

  @State('selectedPipeline', namespace) private selectedPipeline!: Pipeline

  private isEditMode = false

  private dialogStep = 1

  private validStep1 = false
  private validStep2 = true // starts with valid default values
  private validStep3 = true // starts with valid default values
  private validStep4 = true // no fields required
  private validStep5 = true // starts with valid default values

  private dialogPipeline: Pipeline = {
    id: -1,
    adapter: {
      protocol: {
        type: 'HTTP',
        parameters: {
          location:
            'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json'
        }
      },
      format: {
        type: 'JSON',
        parameters: {}
      }
    },
    transformations: [{ func: "data.test = 'abc'; return data;" }],
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
    },
    notifications: []
  }

  created () {
    this.isEditMode = this.$route.meta.isEditMode

    if (this.isEditMode) {
      const id = (this.$route.params.pipelineId as unknown) as number
      this.loadPipelineByIdAction(id)
    }
  }

  @Watch('selectedPipeline')
  onSelectedPipelineChange (value: Pipeline, oldValue: Pipeline) {
    if (value != oldValue) {
      this.dialogPipeline = value
    }
  }

  private onSave () {
    this.createPipelineAction(this.dialogPipeline)
    this.routeToOverview()
  }

  private onUpdate () {
    this.updatePipelineAction(this.dialogPipeline)
    this.routeToOverview()
  }

  private onCancel (): void {
    this.routeToOverview()
  }

  private routeToOverview (): void {
    this.$router.push({ name: 'pipeline-overview' })
  }

  private required (val: string) {
    return !!val || 'required.'
  }

  private evaluateAllForms() {
    return this.validStep1
        && this.validStep2
        && this.validStep3
        && this.validStep4
        && this.validStep5;
  }
}
</script>
