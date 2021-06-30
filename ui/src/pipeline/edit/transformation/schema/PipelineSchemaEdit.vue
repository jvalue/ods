<template>
  <v-form
    v-model="isValid"
  >
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
      <v-btn
        color="primary"
        class="ma-2"
        @click="onGenerate"
      >
        Generate schema
      </v-btn>      
    </v-card-actions>
    <v-textarea
      v-model="schemaAsText"
      label="Datasource schema suggestion"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as SchemaSuggestionREST from './../../../../datasource/schemaSuggestionRest'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

import { Emit, PropSync } from 'vue-property-decorator'
import { requiredRule } from '../../../../validators'
import PipeLine from '../../../pipeline'
import { SliderConfig } from './slider/config'

@Component({ components: { VueSlider } })
export default class PipelineSchemaEdit extends Vue {

  private isValid = true
  private required = requiredRule
  private currentSliderValue = '1'
  private sliderConfig = SliderConfig
  private schemaAsText = ''

  mounted (): void{
    this.schemaAsText = JSON.stringify(this.pipeLine.schema)
  }

  @PropSync('value')
  private pipeLine!: PipeLine

  @Emit('value')
  emitValue (): PipeLine {
    return this.pipeLine
  }

  @Emit('validityChanged')
  emitValid (): boolean {
    return this.isValid
  }

  formChanged (): void {
    this.emitValue()
    this.emitValid()
  }

  private async onGenerate (): Promise<void> {
    this.pipeLine.schema = 
      await SchemaSuggestionREST.getSchema(JSON.stringify(preview), this.currentSliderValue)
    this.schemaAsText = JSON.stringify(this.dataSource.schema)
  }
}
</script>
