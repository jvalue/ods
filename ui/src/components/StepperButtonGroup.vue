<template>
  <div>
    <v-btn v-if="previousVisible" class="ma-2" @click="previousStep">
      Back
    </v-btn>
    <v-btn v-if="nextVisible" :disabled="!nextEnabled" color="primary" class="ma-2" @click="nextStep">
      Next
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Component({})
export default class StepperButtonGroup extends Vue {
  @Prop(Number)
  private readonly step!: number;

  @Prop({ default: 'true' })
  private readonly nextEnabled!: boolean;

  @Prop({ default: 'true' })
  private readonly nextVisible!: boolean;

  @Prop({ default: 'true' })
  private readonly previousVisible!: boolean;

  @Emit('stepChanged')
  private nextStep(): number {
    return this.step + 1;
  }

  @Emit('stepChanged')
  private previousStep(): number {
    return this.step - 1;
  }
}
</script>
