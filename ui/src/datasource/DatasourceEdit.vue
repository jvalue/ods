<template>
  <div>
    <v-card class="mx-auto">
      <v-toolbar dense class="elevation-0">
        <v-toolbar-title>
          Edit Datasource
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <datasource-form
          v-model="datasource"
          @validityChanged="e => (isValid = e)"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" class="ma-2" @click="onCancel">
          Cancel
        </v-btn>
        <v-btn
          :disabled="!isValid"
          color="primary"
          class="ma-2"
          @click="onEdit()"
        >
          Update
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import Datasource from './datasource';
import DatasourceForm from './DatasourceForm.vue';
import * as DatasourceREST from './datasourceRest';

@Component({
  components: { DatasourceForm },
})
export default class DatasourceEdit extends Vue {
  private datasource: Datasource | null = null;
  private isValid = false;

  mounted(): void {
    const id = Number.parseInt(this.$route.params.datasourceId, 10);
    this.loadDatasourceById(id);
  }

  private loadDatasourceById(id: number): void {
    DatasourceREST.getDatasourceById(id)
      .then(datasource => (this.datasource = datasource))
      .catch(error => console.error('Failed to load datasource', error));
  }

  private async onEdit(): Promise<void> {
    if (this.datasource == null) {
      return;
    }

    await DatasourceREST.updateDatasource(this.datasource);
    this.routeToOverview();
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
