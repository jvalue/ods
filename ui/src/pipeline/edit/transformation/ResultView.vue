<template>
  <div>
    <div v-if="result">
      <div v-if="result.data">
        <v-subheader>Transformed Data</v-subheader>
        <v-card-text class="text-left">
          <pre>{{ result.data }}</pre>
        </v-card-text>
      </div>

      <div v-if="result.error">
        <v-subheader class="red--text">
          Error
        </v-subheader>
        <v-card-text class="text-left">
          <pre>{{ result.error }}</pre>
        </v-card-text>
      </div>

      <v-subheader>Meta-Data</v-subheader>
      <v-card-text style="text-align:left">
        <p>
          start: {{ result.stats.startTimestamp | timestamp }}<br>
          end: {{ result.stats.endTimestamp | timestamp }}<br>
          job duration: {{ result.stats.durationInMilliSeconds | duration }}
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
import Vue from 'vue'
import Component from 'vue-class-component'

import { duration, timestamp } from '@/filters'
import { JobResult } from './transformation'
import { Prop } from 'vue-property-decorator'

@Component({
  filters: { duration, timestamp }
})
export default class ResultView extends Vue {
  @Prop() readonly result!: JobResult
}
</script>
