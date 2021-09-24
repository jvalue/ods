<template>
  <div>
    <div v-if="result">
      <div v-if="result.data">
        <v-subheader>Transformed Data</v-subheader>
        <v-card-text class="text-left">
          <pre style="max-height: 400px; overflow:auto; text-align: left">{{
            result.data
          }}</pre>
        </v-card-text>
      </div>

      <div v-if="result.error">
        <v-subheader class="red--text">
          Error
        </v-subheader>
        <v-card-text class="text-left">
          <pre style="max-height: 400px; overflow:auto; text-align: left">{{
            result.error
          }}</pre>
        </v-card-text>
      </div>

      <v-subheader>Meta-Data</v-subheader>
      <v-card-text style="text-align:left">
        <p>
          start: {{ formatTimestamp(result.stats.startTimestamp) }}<br />
          end: {{ formatTimestamp(result.stats.endTimestamp) }}<br />
          job duration:
          {{ formatDuration(result.stats.durationInMilliSeconds) }}
        </p>
      </v-card-text>
    </div>
    <div v-if="!result">
      <v-card-text style="text-align:left">
        <p>no result available</p>
      </v-card-text>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { JobResult } from './transformation';

import { duration, timestamp } from '@/filters';

@Component
export default class ResultView extends Vue {
  @Prop() readonly result!: JobResult;

  // Vetur does not like filters -> use Vue 3 approach with computed
  formatTimestamp(value: number): string {
    return timestamp(value);
  }
  formatDuration(value: number): string {
    return duration(value);
  }
}
</script>
