<template>
  <div class="transformation-main">
    <h1>transformation service</h1>
    <v-card>
      <v-form>
        <v-textarea v-model="functionInput" full-width></v-textarea>
      </v-form>
    </v-card>
    <v-btn color="success" @click="submit">submit</v-btn>
    <h2>{{transformationResult}}</h2>
  </div>
</template>


<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Action, State } from 'vuex-class';

const namespace = { namespace: 'transformation' };

@Component
export default class TransformationMain extends Vue {
  @State('transformationResult', namespace) private transformationResult!: any;

  @Action('transformData', namespace)
  private transformData!: (functionInput: string) => void;

  private functionInput: string = '{"func":"return 1", "data":null}';

  private submit() {
    this.transformData(this.functionInput);
  }

}
</script>