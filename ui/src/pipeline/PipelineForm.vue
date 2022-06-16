<template>
  <div>
    <v-stepper v-model="dialogStep" vertical>
      <v-stepper-step :complete="dialogStep > 1" step="1">
        Pipeline Name
        <small>Choose a name to display the pipeline</small>
      </v-stepper-step>
      <v-stepper-content step="1">
        <v-form v-model="validStep1">
          <v-text-field
            v-model="pipeline.metadata.displayName"
            label="Pipeline Name"
            :rules="[required]"
          />
          <v-text-field
            v-model.number="pipeline.datasourceId"
            label="Referenced Datasource Id"
            :rules="[required]"
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

      <v-stepper-step :complete="dialogStep > 2" step="2">
        Transformation
        <small>Customize data transformation</small>
      </v-stepper-step>
      <v-stepper-content step="2">
        <pipeline-transformation-config
          v-model="pipeline.transformation"
          :datasource-id="pipeline.datasourceId"
          @validityChanged="validStep2 = isSchemaAlive ? $event : $event + 1"
        />
        <stepper-button-group
          :step="2"
          :next-enabled="validStep2"
          @stepChanged="dialogStep = isSchemaAlive ? $event : $event + 1"
        />
      </v-stepper-content>

      <v-stepper-step v-if="isSchemaAlive" :complete="dialogStep > 3" step="3">
        Generated schema
        <small>Customize the generated schema </small>
      </v-stepper-step>
      <v-stepper-content v-if="isSchemaAlive" step="3">
        <pipeline-schema-edit
          v-model="pipeline"
          @validityChanged="validStep3 = $event"
        />
        <stepper-button-group
          :step="3"
          :next-enabled="validStep3"
          @stepChanged="dialogStep = $event"
        />
      </v-stepper-content>

      <v-stepper-step :complete="dialogStep > 4" step="4">
        Meta-Data
      </v-stepper-step>
      <v-stepper-content step="4">
        <pipeline-metadata-config
          v-model="pipeline.metadata"
          @validityChanged="validStep4 = $event"
        />
      </v-stepper-content>
    </v-stepper>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, PropSync, Watch } from 'vue-property-decorator';

import * as SchemaSuggestionREST from './../datasource/schemaSuggestionRest';
import PipelineSchemaEdit from './edit/schema/PipelineSchemaEdit.vue';

import StepperButtonGroup from '@/components/StepperButtonGroup.vue';
import PipelineMetadataConfig from '@/pipeline/edit/PipelineMetadataConfig.vue';
import PipelineTransformationConfig from '@/pipeline/edit/transformation/PipelineTransformationConfig.vue';
import Pipeline from '@/pipeline/pipeline';
import { requiredRule } from '@/validators';

@Component({
  components: {
    StepperButtonGroup,
    PipelineMetadataConfig,
    PipelineTransformationConfig,
    PipelineSchemaEdit,
  },
})
export default class PipelineForm extends Vue {
  private dialogStep = 1;
  private validStep1 = false;
  private validStep2 = false; // Need to execute
  private validStep3 = true; // Starts with valid default values
  private validStep4 = true; // Starts with valid default values

  @PropSync('value')
  private pipeline!: Pipeline;

  private isSchemaAlive = false;
  private required = requiredRule;

  async mounted(): Promise<void> {
    const datasourceId = this.$route.params.datasourceId;
    if (datasourceId !== undefined) {
      this.pipeline.datasourceId = Number.parseInt(datasourceId, 10);
    }
    await this.updateIsSchemaAlive();
  }

  private async updateIsSchemaAlive(): Promise<void> {
    try {
      const isAliveResponse = await SchemaSuggestionREST.getIsAlive();
      this.isSchemaAlive = isAliveResponse === 'alive';
    } catch (error) {
      console.info('Schema recommendation service not active.');
    }
  }

  get isValid(): boolean {
    return (
      this.validStep1 && this.validStep2 && this.validStep3 && this.validStep4
    );
  }

  @Emit('validityChanged')
  private emitIsValid(): boolean {
    return this.isValid;
  }

  @Watch('isValid')
  private onIsValidChanged(): void {
    this.emitIsValid();
  }
}
</script>
