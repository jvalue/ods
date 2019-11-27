<template>
  <div>
    <v-btn
      class="ma-2"
      @click="previousStep"
    >
      Back
    </v-btn>
    <v-btn
      :disabled="!nextEnabled"
      color="primary"
      class="ma-2"
      @click="nextStep"
    >
      Next
    </v-btn>
  </div>
</template>


<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Emit, Prop, PropSync } from 'vue-property-decorator'

@Component({ })
export default class PipelineEditStepperButtonGroup extends Vue {

  @Prop(Number)
  private readonly step!: number;

  @Prop(Boolean)
  private readonly nextEnabled = true;

  @Emit("stepChanged")
  private nextStep() {
    return this.step + 1;
  }

  @Emit("stepChanged")
  private previousStep() {
    return this.step - 1;
  }
}
</script>
