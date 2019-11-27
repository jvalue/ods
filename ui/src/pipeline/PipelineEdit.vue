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
              ref="formStep1"
              v-model="validStep1"
            >
              <v-text-field
                v-model="dialogPipeline.metadata.displayName"
                label="Pipeline Name"
                :rules="[required]"
              />
              <v-btn
                :disabled="!validStep1"
                color="primary"
                class="ma-2"
                @click="dialogStep = 2"
              >
                Next
              </v-btn>
            </v-form>
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
            <pipeline-edit-setpper-button-group v-bind:step="2" v-bind:nextEnabled="validStep2" v-on:stepChanged="dialogStep = $event" />
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
              <pipeline-edit-setpper-button-group v-bind:step="3" v-bind:nextEnabled="validStep3" v-on:stepChanged="dialogStep = $event" />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 4"
            step="4"
          >
            Meta-Data
          </v-stepper-step>
          <v-stepper-content step="4">
            <v-form
              ref="formStep4"
              v-model="validStep4"
            >
              <v-text-field
                v-model="dialogPipeline.metadata.description"
                label="Pipeline Description"
              />
              <v-text-field
                v-model="dialogPipeline.metadata.author"
                label="Author"
              />
              <v-text-field
                v-model="dialogPipeline.metadata.license"
                label="License"
              />
            </v-form>
            <pipeline-edit-setpper-button-group v-bind:step="4" v-bind:nextEnabled="validStep4" v-on:stepChanged="dialogStep = $event" />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 5"
            step="5"
          >
            Trigger Configuration
            <small>Configure Execution Details</small>
          </v-stepper-step>
          <v-stepper-content step="5">
            <v-form
              ref="formStep5"
              v-model="validStep5"
            >
              <v-switch
                v-model="dialogPipeline.trigger.periodic"
                label="Periodic execution"
              />
              <date-time-picker
                v-model="dialogPipeline.trigger.firstExecution"
              />

              <span class="subheading font-weight-light mr-1">Interval: {{ dialogIntervalHours }}h {{ dialogIntervalMinutes }}m</span>
              <v-subheader>Hours</v-subheader>
              <v-slider
                v-model="dialogIntervalHours"
                track-color="grey"
                always-dirty
                step="1"
                ticks="always"
                thumb-label="always"
                tick-size="3"
                :tick-labels="hoursTickLabels"
                min="0"
                max="24"
              >
                <template v-slot:prepend>
                  <v-icon
                    color="error"
                    @click="dialogIntervalHours--"
                  >
                    mdi-minus
                  </v-icon>
                </template>

                <template v-slot:append>
                  <v-icon
                    color="primary"
                    @click="dialogIntervalHours++"
                  >
                    mdi-plus
                  </v-icon>
                </template>
              </v-slider>

              <v-subheader>Minutes</v-subheader>
              <v-slider
                v-model="dialogIntervalMinutes"
                track-color="grey"
                always-dirty
                step="1"
                ticks="always"
                thumb-label="always"
                :tick-labels="minutesTickLabels()"
                min="0"
                max="60"
              >
                <template v-slot:prepend>
                  <v-icon
                    color="error"
                    @click="dialogIntervalMinutes--"
                  >
                    mdi-minus
                  </v-icon>
                </template>

                <template v-slot:append>
                  <v-icon
                    color="primary"
                    @click="dialogIntervalMinutes++"
                  >
                    mdi-plus
                  </v-icon>
                </template>
              </v-slider>

              <v-btn
                class="ma-2"
                @click="dialogStep = 4"
              >
                Back
              </v-btn>
              <v-btn
                v-if="isEditMode"
                :disabled="!validStep5"
                color="primary"
                class="ma-2"
                @click="onUpdate"
              >
                Update
              </v-btn>
              <v-btn
                v-else
                :disabled="!validStep5"
                color="primary"
                class="ma-2"
                @click="onSave"
              >
                Save
              </v-btn>
            </v-form>
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

import DateTimePicker from '@/components/DateTimePicker.vue'
import PipelineAdapterConfig from './edit/PipelineAdapterConfig.vue'
import PipelineEditSetpperButtonGroup from './edit/PipelineEditStepperButtonGroup.vue'
import PipelineTransformationConfig from './edit/PipelineTransformationConfig.vue'

const namespace = { namespace: 'pipeline' }

const ONE_HOUR_IN_MS = 3600 * 1000

const ONE_MINUTE_IN_MS = 60 * 1000

@Component({
  components: { DateTimePicker, PipelineAdapterConfig, PipelineEditSetpperButtonGroup, PipelineTransformationConfig }
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

  private dialogIntervalHours = 1
  private dialogIntervalMinutes = 0

  private hoursTickLabels = ['0h', '', '', '', '', '', '6h', '', '', '', '', '', '12h', '', '', '', '', '', '18h', '', '', '', '', '', '24h']
  private minutesTickLabels = () => {
    const ticks = new Array(61)
    ticks[0] = '0m'
    ticks[15] = '15m'
    ticks[30] = '30m'
    ticks[45] = '45m'
    ticks[60] = '60m'
    return ticks
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
      this.loadDialogIntervalForSlider()
    }
  }

  private setDialogInterval () {
    const hoursInMS = this.dialogIntervalHours * ONE_HOUR_IN_MS
    const minutesInMS = this.dialogIntervalMinutes * ONE_MINUTE_IN_MS
    this.dialogPipeline.trigger.interval = hoursInMS + minutesInMS
  }

  private loadDialogIntervalForSlider () {
    if (this.dialogPipeline.trigger.interval <= 1) {
      this.dialogIntervalHours = 0
      this.dialogIntervalMinutes = 0
      return
    }

    const intervalInMS = this.dialogPipeline.trigger.interval
    this.dialogIntervalHours = this.getHoursFromMS(intervalInMS)
    this.dialogIntervalMinutes = this.getMinutesFromMS(intervalInMS)
  }

  private getHoursFromMS (intervalInMS: number): number {
    return Math.floor(intervalInMS / ONE_HOUR_IN_MS)
  }

  private getMinutesFromMS (intervalInMS: number): number {
    return Math.floor((intervalInMS % ONE_HOUR_IN_MS) / ONE_MINUTE_IN_MS)
  }

  private onSave () {
    this.setDialogInterval()
    this.createPipelineAction(this.dialogPipeline)
    this.routeToOverview()
  }

  private onUpdate () {
    this.setDialogInterval()
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
}
</script>
