<template>
  <div class="pipeline-edit">
    <v-card class="mx-auto">
      <v-toolbar dense class="elevation-0">
        <v-toolbar-title>
          <span v-if="isEditMode">Update Pipeline with id: {{dialogPipeline.id}}</span>
          <span v-else>Create new Pipeline</span>
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-stepper v-model="dialogStep" vertical>
          <v-stepper-step :complete="dialogStep > 1" step="1">
            Pipeline Name
            <small>Choose a name to display the pipeline</small>
          </v-stepper-step>
          <v-stepper-content step="1">
            <v-form ref="formStep1" v-model="validStep1">
              <v-text-field
                v-model="dialogPipeline.metadata.displayName"
                label="Pipeline Name"
                :rules="[required]"
              ></v-text-field>
              <v-btn :disabled="!validStep1" color="primary" @click="dialogStep = 2">Next</v-btn>
            </v-form>
          </v-stepper-content>

          <v-stepper-step :complete="dialogStep > 2" step="2">
            Adapter Configuration
            <small>Configure the data import</small>
          </v-stepper-step>
          <v-stepper-content step="2">
            <v-form ref="formStep2" v-model="validStep2">
              <v-select
                v-model="dialogPipeline.adapter.protocol"
                :items="availableAdapterProtocols"
                label="Protocol"
                :rules="[required]"
              ></v-select>
              <v-select
                v-model="dialogPipeline.adapter.format"
                :items="availableAdapterFormats"
                label="Format"
                :rules="[required]"
              ></v-select>
              <v-text-field
                v-model="dialogPipeline.adapter.location"
                label="URL"
                :rules="[required]"
              ></v-text-field>
              <v-btn @click="dialogStep = 1">Back</v-btn>
              <v-btn :disabled="!validStep2" color="primary" @click="dialogStep = 3">Next</v-btn>
            </v-form>
          </v-stepper-content>

          <v-stepper-step :complete="dialogStep > 3" step="3">
            Transformations
            <small>Customize data transformations</small>
          </v-stepper-step>
          <v-stepper-content step="3">
            <v-form ref="formStep3" v-model="validStep3">
              <v-textarea
                v-model="dialogPipeline.transformations[0].func"
                label="Transformation function"
                rows="3"
                :rules="[required]"
              />
              <v-btn @click="dialogStep = 2">Back</v-btn>
              <v-btn :disabled="!validStep3" color="primary" @click="dialogStep = 4">Next</v-btn>
            </v-form>
          </v-stepper-content>

          <v-stepper-step :complete="dialogStep > 4" step="4">Meta-Data</v-stepper-step>
          <v-stepper-content step="4">
            <v-form ref="formStep4" v-model="validStep4">
              <v-text-field
                v-model="dialogPipeline.metadata.description"
                label="Pipeline Description"
              />
              <v-text-field v-model="dialogPipeline.metadata.author" label="Author" />
              <v-text-field v-model="dialogPipeline.metadata.license" label="License" />
              <v-btn @click="dialogStep = 3">Back</v-btn>
              <v-btn :disabled="!validStep4" color="primary" @click="dialogStep = 5">Next</v-btn>
            </v-form>
          </v-stepper-content>

          <v-stepper-step :complete="dialogStep > 5" step="5">
            Trigger Configuration
            <small>Configure Execution Details</small>
          </v-stepper-step>
          <v-stepper-content step="5">
            <v-form ref="formStep5" v-model="validStep5">
              <v-switch v-model="dialogPipeline.trigger.periodic" label="Periodic execution"></v-switch>
              <v-text-field
                v-model="dialogPipeline.trigger.interval"
                label="Interval [milliseconds]"
                type="number"
                :rules="[required]"
              ></v-text-field>
              <v-btn @click="dialogStep = 4">Back</v-btn>
              <v-btn
                :disabled="!validStep5"
                v-if="isEditMode"
                color="primary"
                @click="onUpdate"
              >Update</v-btn>
              <v-btn :disabled="!validStep5" v-else color="primary" @click="onSave">Save</v-btn>
            </v-form>
          </v-stepper-content>
        </v-stepper>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="onCancel">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
          
      
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { Action, State } from "vuex-class";
import Pipeline from "./pipeline";

const namespace = { namespace: "pipeline" };

@Component
export default class PipelineEdit extends Vue {
  @Action("loadPipelineById", namespace) private loadPipelineByIdAction!: (id: number) => void;
  @Action("createPipeline", namespace) private createPipelineAction!: (p: Pipeline) => void;
  @Action("updatePipeline", namespace) private updatePipelineAction!: (p: Pipeline) => void;
  
  @State('selectedPipeline', namespace) private selectedPipeline!: Pipeline 

  private isEditMode: boolean = false;

  private dialogStep: number = 1;

  private validStep1: boolean = false;
  private validStep2: boolean = true; // starts with valid default values
  private validStep3: boolean = true; // starts with valid default values
  private validStep4: boolean = true; // no fields required
  private validStep5: boolean = true; // starts with valid default values

  private availableAdapterProtocols = ["HTTP"];
  private availableAdapterFormats = ["JSON", "XML"];

  private dialogPipeline: Pipeline = {
    id: -1,
    adapter: {
      protocol: this.availableAdapterProtocols[0],
      format: this.availableAdapterFormats[0],
      location:
        "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json"
    },
    transformations: [{ func: "data.test = 'abc'; return data;" }],
    metadata: {
      author: "",
      license: "",
      description: "",
      displayName: ""
    },
    trigger: {
      periodic: true,
      interval: 60000
    }
  };

  created() {
    this.isEditMode = this.$route.meta.isEditMode

    if(this.isEditMode) {
        const id = this.$route.params.pipelineId as unknown as number
        this.loadPipelineByIdAction(id)
    }
  }

  @Watch('selectedPipeline')
  onSelectedPipelineChange(value: Pipeline, oldValue: Pipeline) {
    if(value != oldValue) {
      this.dialogPipeline = value
    }
  }

  private onSave() {
    this.createPipelineAction(this.dialogPipeline)
    this.routeToOverview();
  }

  private onUpdate() {
    this.updatePipelineAction(this.dialogPipeline)
    this.routeToOverview();
  }

  private onCancel(): void {
    this.routeToOverview();
  }

  private routeToOverview(): void {
    this.$router.push({ name: "pipeline-overview" });
  }

  private required(val: string) {
    return !!val || "required.";
  }
}
</script>
      