<template>
  <div>
    <v-btn
      v-if="previousVisible"
      class="ma-2"
      @click="previousStep"
    >
      Back
    </v-btn>
    <v-btn
      v-if="nextVisible"
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

  @Prop({ default: "true" })
  private readonly nextEnabled!: boolean;
  @Prop({ default: "true" })
  private readonly nextVisible!: boolean;
  @Prop({ default: "true" })
  private readonly previousVisible!: boolean;

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
