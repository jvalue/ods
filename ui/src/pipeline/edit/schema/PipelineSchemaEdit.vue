<template>
  <v-form v-model="isValid">
    <v-card-actions>
      <div>
        <vue-slider
          v-model="currentSliderValue"
          v-bind="sliderConfig.options"
          :data="sliderConfig.sliderData"
          :data-value="'name'"
          :data-label="'name'"
        />
      </div>
      <v-btn color="primary" class="ma-2" @click="onGenerate">
        Generate schema
      </v-btn>
    </v-card-actions>
    <v-textarea
      v-model="schemaAsText"
      label="Pipeline schema suggestion"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, PropSync } from 'vue-property-decorator';
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';

import { requiredRule } from '../../../validators';
import Pipeline from '../../pipeline';

import * as DatasourceRest from './../../../datasource/datasourceRest';
import * as SchemaSuggestionREST from './../../../datasource/schemaSuggestionRest';
import { PIPELINE_SERVICE_URL } from './../../../env';
import {
  JobResult,
  TransformationRequest,
} from './../transformation/transformation';
import { TransformationRest } from './../transformation/transformationRest';
import { SliderConfig } from './slider/config';

@Component({ components: { VueSlider } })
export default class PipelineSchemaEdit extends Vue {
  private isValid = true;
  private required = requiredRule;
  private currentSliderValue = '1';
  private sliderConfig = SliderConfig;
  private schemaAsText = '';

  @PropSync('value')
  private pipeline!: Pipeline;

  mounted(): void {
    if (this.pipeline.schema != null || this.pipeline.schema !== undefined) {
      this.schemaAsText = JSON.stringify(this.pipeline.schema);
    }
  }

  @Emit('value')
  emitValue(): Pipeline {
    return this.pipeline;
  }

  @Emit('validityChanged')
  emitValid(): boolean {
    return this.isValid;
  }

  formChanged(): void {
    this.emitValue();
    this.emitValid();
  }

  private async onGenerate(): Promise<void> {
    const data = await DatasourceRest.getDatasourceData(
      this.pipeline.datasourceId,
    );
    const request: TransformationRequest = {
      data: data,
      func: this.pipeline.transformation.func,
    };
    const result: JobResult = await new TransformationRest(
      PIPELINE_SERVICE_URL,
    ).transformData(request);
    this.pipeline.schema = await SchemaSuggestionREST.getSchema(
      JSON.stringify(result.data),
      this.currentSliderValue,
    );
    this.schemaAsText = JSON.stringify(this.pipeline.schema);
  }
}
</script>
