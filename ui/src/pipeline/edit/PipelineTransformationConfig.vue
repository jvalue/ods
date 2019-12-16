<template>
  <v-form
    v-model="validForm"
  >
    <v-textarea
      v-model="transformationConfigs[0].func"
      label="Transformation function"
      rows="3"
      :rules="[required]"
      @keyup="formChanged"
    />
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, PropSync } from 'vue-property-decorator'

import { TransformationConfig } from '../pipeline'

@Component({ })
export default class PipelineTransformationConfig extends Vue {
  private validForm = true;

  @PropSync('value')
  private transformationConfigs!: TransformationConfig[];

  @Emit('value')
  emitValue () {
    return this.transformationConfigs
  }

  @Emit('validityChanged')
  emitValid () {
    return this.validForm
  }

  formChanged () {
    this.emitValue()
    this.emitValid()
  }

  private required (val: string) {
    return !!val || 'required.'
  }
}
</script>
