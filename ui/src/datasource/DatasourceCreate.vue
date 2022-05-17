<template>
  <div>
    <v-container class="mx-auto">
      <datasource-form
        v-model="datasource"
        @validityChanged="e => (isValid = e)"
      />
      <div class="float-right">
        <v-spacer />
        <v-btn color="error" class="ma-2" @click="onCancel()">
          Cancel
        </v-btn>
        <v-btn
          :disabled="!isValid"
          color="primary"
          class="ma-2"
          @click="onSave()"
        >
          Save
        </v-btn>
      </div>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import Datasource from './datasource';
import DatasourceForm from './DatasourceForm.vue';
import * as DatasourceREST from './datasourceRest';

const MINUTE = 60000;
const HOUR = 3600000;

@Component({
  components: { DatasourceForm },
})
export default class DatasourceCreate extends Vue {
  private datasource: Datasource = {
    id: -1,
    protocol: {
      type: 'HTTP',
      parameters: {
        location:
          'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
        encoding: 'UTF-8',
      },
    },
    format: {
      type: 'JSON',
      parameters: {},
    },
    metadata: {
      author: '',
      license: '',
      description: '',
      displayName: '',
    },
    trigger: {
      periodic: true,
      firstExecution: new Date(Date.now() + 10 * MINUTE),
      interval: HOUR,
    },
  };

  private isValid = false;

  private onSave(): void {
    DatasourceREST.createDatasource(this.datasource)
      .then(() => this.routeToOverview())
      .catch(error => console.error('Failed to create datasource', error));
  }

  private onCancel(): void {
    this.routeToOverview();
  }

  private routeToOverview(): void {
    this.$router
      .push({ name: 'datasource-overview' })
      .catch(error =>
        console.log('Failed to route to datasource-overview', error),
      );
  }
}
</script>
