<template>
  <div>
    <div v-if="result.data">
      <v-subheader>Transformed Data</v-subheader>
      <v-card-text class="text-left">
        <pre>{{result.data}}</pre>
      </v-card-text>
    </div>

    <div v-if="result.error">
      <v-subheader class="red--text">Error</v-subheader>
      <v-card-text class="text-left">
        <pre>{{result.error}}</pre>
      </v-card-text>
    </div>

    <v-subheader>Meta-Data</v-subheader>
    <v-card-text style="text-align:left">
      <p>
        start: {{result.stats.startTimestamp | timestamp}}<br/>
        end: {{result.stats.endTimestamp | timestamp}}<br/>
        job duration: {{result.stats.durationInMilliSeconds | duration}}
      </p>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Component from 'vue-class-component'

import { duration, timestamp } from '../filters'
import JobResult from './interfaces/jobResult'

const Props = Vue.extend({
  props: {
    result: Object as PropType<JobResult>,
  }
})

@Component({
  filters: { duration, timestamp }
})
export default class TextAreaDataProvider extends Props {

}
</script>
